.PHONY: all clean

all: mysay authorize_terminal list-voices personal-speak

mysay: mysay.c
	gcc -arch arm64e -x objective-c -framework Foundation -framework AudioToolbox -shared mysay.c -o mysay-arm64e.dylib
	gcc -arch x86_64 -x objective-c -framework Foundation -framework AudioToolbox -shared mysay.c -o mysay-x86_64.dylib
	lipo -create mysay-arm64e.dylib mysay-x86_64.dylib -o mysay.dylib
	rm -f mysay-arm64e.dylib mysay-x86_64.dylib

authorize_terminal: authorize_terminal.c
	gcc -x objective-c -arch arm64e -framework Foundation -framework AVFoundation authorize_terminal.c -o authorize_terminal_arm64e
	gcc -x objective-c -arch x86_64 -framework Foundation -framework AVFoundation authorize_terminal.c -o authorize_terminal_x86_64
	lipo -create authorize_terminal_arm64e authorize_terminal_x86_64 -o authorize_terminal
	rm -f authorize_terminal_arm64e authorize_terminal_x86_64

list-voices: list-voices.m
	gcc -x objective-c -framework Foundation -framework AVFoundation list-voices.m -o list-voices

personal-speak: personal-speak.m
	gcc -x objective-c -framework Foundation -framework AVFoundation personal-speak.m -o personal-speak

clean:
	rm -f mysay.dylib authorize_terminal list-voices personal-speak