#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

static NSString *outputPath = nil;
static ExtAudioFileRef audioFile = NULL;
static BOOL captureEnabled = NO;

OSStatus replaced_AudioUnitRender(AudioUnit inUnit,
                                  AudioUnitRenderActionFlags *ioActionFlags,
                                  const AudioTimeStamp *inTimeStamp,
                                  UInt32 inOutputBusNumber,
                                  UInt32 inNumberFrames,
                                  AudioBufferList *ioData) {
  if (!captureEnabled || !outputPath) {
    return AudioUnitRender(inUnit, ioActionFlags, inTimeStamp, inOutputBusNumber,
                           inNumberFrames, ioData);
  }

  AudioStreamBasicDescription desc;
  UInt32 size = sizeof(desc);
  AudioUnitGetProperty(inUnit, kAudioUnitProperty_StreamFormat, kAudioUnitScope_Output,
                       0, &desc, &size);

  if (!audioFile) {
    AudioStreamBasicDescription fileDescription = {0};
    fileDescription.mSampleRate = 48000;
    fileDescription.mFormatID = kAudioFormatLinearPCM;
    fileDescription.mFormatFlags = 41;
    fileDescription.mBytesPerPacket = 4;
    fileDescription.mFramesPerPacket = 1;
    fileDescription.mBytesPerFrame = 4;
    fileDescription.mChannelsPerFrame = 1;
    fileDescription.mBitsPerChannel = 32;

    CFURLRef url = CFURLCreateWithFileSystemPath(
        NULL, (__bridge CFStringRef)outputPath, kCFURLPOSIXPathStyle, false);
    OSStatus status =
        ExtAudioFileCreateWithURL(url, kAudioFileCAFType, &fileDescription, NULL,
                                  kAudioFileFlags_EraseFile, &audioFile);
    CFRelease(url);
    if (status != noErr) {
      fprintf(stderr, "create file failed: %d\n", (int)status);
      return AudioUnitRender(inUnit, ioActionFlags, inTimeStamp, inOutputBusNumber,
                             inNumberFrames, ioData);
    }
    ExtAudioFileSetProperty(audioFile, kExtAudioFileProperty_ClientDataFormat,
                            sizeof(AudioStreamBasicDescription), &desc);
    fprintf(stderr, "capturing to %s\n", [outputPath UTF8String]);
  }

  ExtAudioFileWrite(audioFile, inNumberFrames, ioData);
  return AudioUnitRender(inUnit, ioActionFlags, inTimeStamp, inOutputBusNumber,
                         inNumberFrames, ioData);
}

__attribute__((constructor)) static void install_interpose(void) {
  // Intentionally rely on DYLD_INSERT_LIBRARIES wrapper built separately.
}

int main(int argc, char **argv) {
  if (argc < 4) {
    fprintf(stderr, "usage: speak-to-file <voice-identifier-or-name> <output.caf> <text>\n");
    return 1;
  }

  NSString *voiceKey = [NSString stringWithUTF8String:argv[1]];
  outputPath = [NSString stringWithUTF8String:argv[2]];
  NSString *text = [NSString stringWithUTF8String:argv[3]];

  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block AVSpeechSynthesisVoice *selectedVoice = nil;

  [AVSpeechSynthesizer requestPersonalVoiceAuthorizationWithCompletionHandler:^(
      AVSpeechSynthesisPersonalVoiceAuthorizationStatus status) {
    if (status != AVSpeechSynthesisPersonalVoiceAuthorizationStatusAuthorized) {
      fprintf(stderr, "personal voice auth denied: %ld\n", (long)status);
      dispatch_semaphore_signal(sem);
      return;
    }

    selectedVoice = [AVSpeechSynthesisVoice voiceWithIdentifier:voiceKey];
    if (!selectedVoice) {
      for (AVSpeechSynthesisVoice *voice in [AVSpeechSynthesisVoice speechVoices]) {
        if ([[voice name] isEqualToString:voiceKey]) {
          selectedVoice = voice;
          break;
        }
      }
    }

    if (!selectedVoice) {
      fprintf(stderr, "voice not found: %s\n", [voiceKey UTF8String]);
      dispatch_semaphore_signal(sem);
      return;
    }

    BOOL isPersonal =
        ([selectedVoice voiceTraits] & AVSpeechSynthesisVoiceTraitIsPersonalVoice) != 0;
    fprintf(stderr, "using name=%s id=%s personal=%d\n", [[selectedVoice name] UTF8String],
            [[selectedVoice identifier] UTF8String], isPersonal);

    AVSpeechSynthesizer *synth = [[AVSpeechSynthesizer alloc] init];
    AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
    utterance.voice = selectedVoice;
    utterance.rate = AVSpeechUtteranceDefaultSpeechRate;

    captureEnabled = YES;
    [synth speakUtterance:utterance];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(12 * NSEC_PER_SEC)),
                   dispatch_get_main_queue(), ^{
                     if (audioFile) {
                       ExtAudioFileDispose(audioFile);
                       audioFile = NULL;
                     }
                     dispatch_semaphore_signal(sem);
                   });
  }];

  dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 30 * NSEC_PER_SEC));
  return audioFile || [[NSFileManager defaultManager] fileExistsAtPath:outputPath] ? 0 : 2;
}