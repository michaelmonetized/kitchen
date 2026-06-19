#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

int main(int argc, char **argv) {
  if (argc < 4) {
    fprintf(stderr, "usage: personal-speak -v <voice> -o <output.caf> <text>\n");
    return 1;
  }

  NSString *voiceKey = nil;
  NSString *text = nil;

  for (int i = 1; i < argc; i++) {
    if (!strcmp(argv[i], "-v") && i + 1 < argc) {
      voiceKey = [NSString stringWithUTF8String:argv[++i]];
    } else if (!strcmp(argv[i], "-o") && i + 1 < argc) {
      // mysay.dylib reads -o from argv when injected
      i++;
    } else if (argv[i][0] != '-') {
      text = [NSString stringWithUTF8String:argv[i]];
    }
  }

  if (!voiceKey || !text) {
    fprintf(stderr, "missing -v or text\n");
    return 1;
  }

  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block int exitCode = 0;

  [AVSpeechSynthesizer requestPersonalVoiceAuthorizationWithCompletionHandler:^(
      AVSpeechSynthesisPersonalVoiceAuthorizationStatus status) {
    if (status != AVSpeechSynthesisPersonalVoiceAuthorizationStatusAuthorized) {
      fprintf(stderr, "personal voice auth denied: %ld\n", (long)status);
      exitCode = 1;
      dispatch_semaphore_signal(sem);
      return;
    }

    AVSpeechSynthesisVoice *voice = [AVSpeechSynthesisVoice voiceWithIdentifier:voiceKey];
    if (!voice) {
      for (AVSpeechSynthesisVoice *candidate in [AVSpeechSynthesisVoice speechVoices]) {
        if ([[candidate name] isEqualToString:voiceKey] ||
            [[[candidate name] stringByTrimmingCharactersInSet:
                               [NSCharacterSet whitespaceCharacterSet]] isEqualToString:voiceKey]) {
          voice = candidate;
          break;
        }
      }
    }

    if (!voice) {
      fprintf(stderr, "voice not found: %s\n", [voiceKey UTF8String]);
      exitCode = 2;
      dispatch_semaphore_signal(sem);
      return;
    }

    BOOL isPersonal =
        ([voice voiceTraits] & AVSpeechSynthesisVoiceTraitIsPersonalVoice) != 0;
    fprintf(stderr, "speaking with name=%s id=%s personal=%d\n", [[voice name] UTF8String],
            [[voice identifier] UTF8String], isPersonal);

    AVSpeechSynthesizer *synth = [[AVSpeechSynthesizer alloc] init];
    AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
    utterance.voice = voice;
    utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.95;

    [synth speakUtterance:utterance];

    NSTimeInterval estimate = (double)text.length * 0.06 + 1.5;
    dispatch_after(
        dispatch_time(DISPATCH_TIME_NOW, (int64_t)(estimate * NSEC_PER_SEC)),
        dispatch_get_main_queue(), ^{
          dispatch_semaphore_signal(sem);
        });
  }];

  while (dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC)) != 0) {
    [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.25]];
  }
  return exitCode;
}