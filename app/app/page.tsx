import ColoredKeyboard from "./_components/coloredKeyboard";
import CreateLobbyView from "./_components/createLobbyView";
import GuessGrid from "./_components/guessGrid";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-24">
      <CreateLobbyView />
      {/* <GuessGrid
        rows={[
          {
            word: "PARTY",
            colors: [
              Color.GRAY,
              Color.YELLOW,
              Color.GRAY,
              Color.YELLOW,
              Color.GRAY,
            ],
          },
          {
            word: "SLICE",
            colors: [
              Color.GRAY,
              Color.YELLOW,
              Color.GRAY,
              Color.GRAY,
              Color.GRAY,
            ],
          },
          {
            word: "LATEN",
            colors: [
              Color.YELLOW,
              Color.YELLOW,
              Color.YELLOW,
              Color.GRAY,
              Color.GRAY,
            ],
          },
          {
            word: "TABLA",
            colors: [
              Color.YELLOW,
              Color.YELLOW,
              Color.GRAY,
              Color.GREEN,
              Color.GRAY,
            ],
          },
        ]}
        input="YT"
      />
      <ColoredKeyboard /> */}
    </main>
  );
}
