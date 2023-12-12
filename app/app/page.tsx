import Link from "next/link";

import Card from "./_components/card";

export default function Home() {
  return (
    <Card className="prose mx-4 mt-48 flex max-w-xl flex-col items-center">
      <h2>Welcome to Worth of Words!</h2>
      <p>
        Guess your opponents&apos; words before they guess yours in a
        quick-thinking battle royale! Play with a few friends or with a large
        group of any size!
      </p>
      <div className="mt-5 flex justify-center">
        <Link href="/app">
          <button className="btn btn-primary">Get started</button>
        </Link>
      </div>
    </Card>
  );
}
