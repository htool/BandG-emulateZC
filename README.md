# Emulate ZC1/2

## Usage

To start the emulation e.g. on ID 19 use:
$ DEBUG=emulate node emulate.js ZC2 19

## What works
 - On console you can use the following keys:

space/return/enter = knob push
d = display
pageup = zoom out
pagedownA = zoom in
p = power
m = menu
up = up
down = down 
left = left
right = right
escape = pages
i
1
2
3
4
5
6
7
8
9
0

# Status
Assignment is skipped and assumed. Keys are working for me (MFD = 01, ZC = 19).
MOB key for some reasons doesn't work.


captures/ candump captures
captures/reg-[ABCD] are captures of display registration
captures/keys has button press and release
