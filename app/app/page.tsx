import Link from "next/link";

import MainCard from "./_components/mainCard";
import titleImage from "./_images/title.png";

export default function Home() {
  return (
    <MainCard
      title="Worth of Words"
      image={titleImage}
      imageAlt="Worth of Words logo"
      imageHasPriority={true}
    >
      <p>
        Guess your opponents&apos; words before they guess yours in a
        quick-thinking battle royale! Play with a few friends or with a large
        group of any size!
      </p>
      <Link className="btn btn-primary" href="/app">
        Start playing
      </Link>
      <p>
        Or, first, <Link href="/about">learn how to play</Link>.
      </p>
    </MainCard>
  );
}
