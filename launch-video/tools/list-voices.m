#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

int main(int argc, char **argv) {
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);

  [AVSpeechSynthesizer requestPersonalVoiceAuthorizationWithCompletionHandler:^(
      AVSpeechSynthesisPersonalVoiceAuthorizationStatus status) {
    printf("auth_status=%ld\n", (long)status);

    for (AVSpeechSynthesisVoice *voice in [AVSpeechSynthesisVoice speechVoices]) {
      AVSpeechSynthesisVoiceTraits traits = [voice voiceTraits];
      BOOL isPersonal = (traits & AVSpeechSynthesisVoiceTraitIsPersonalVoice) != 0;
      BOOL isNovelty = (traits & AVSpeechSynthesisVoiceTraitIsNoveltyVoice) != 0;

      if (isPersonal || isNovelty ||
          [[voice name] containsString:@"Michael"] ||
          [[voice name] containsString:@"Rusty"] ||
          [[voice name] isEqualToString:@"Samantha"]) {
        printf("name=%s | id=%s | lang=%s | personal=%d | novelty=%d | quality=%ld\n",
               [[voice name] UTF8String], [[voice identifier] UTF8String],
               [[voice language] UTF8String], isPersonal, isNovelty, (long)[voice quality]);
      }
    }

    dispatch_semaphore_signal(sem);
  }];

  dispatch_async(dispatch_get_main_queue(), ^{
    dispatch_semaphore_signal(sem);
  });
  dispatch_semaphore_wait(sem, dispatch_time(DISPATCH_TIME_NOW, 1 * NSEC_PER_SEC));
  [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:15]];
  return 0;
}