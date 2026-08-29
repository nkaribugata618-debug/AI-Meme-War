# Presentation Mode

The Presentation Mode is designed to be displayed on a large screen or projector for the audience to view the final submitted memes before and during voting.

## Technical Implementation
- **Route**: `/presentation/[roomCode]`
- **Framework**: Built with React and Framer Motion for smooth animations between slides.
- **WebSocket State**: Listens to `CompetitionState` and relies on `presentationSlideIndex`. 

## Features
- **Full-Screen Support**: Click the top-right button to enter native browser fullscreen.
- **Keyboard Navigation**: The Host can use `ArrowRight` and `ArrowLeft` keys to emit `NEXT_MEME` and `PREV_MEME` Socket.IO events, seamlessly transitioning the slides across all connected presentation windows.
- **Team Reveal**: Driven by `teamNamesRevealed` boolean in the state. Once toggled, Framer Motion animates the team name below the meme.

## Usage
The host can open this mode from the Host Dashboard by clicking the "Presentation Mode" button in the header. It will open in a new tab.
