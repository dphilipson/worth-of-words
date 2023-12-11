import Link from "next/link";
import { memo, ReactNode } from "react";
import { Address } from "viem";

import Card from "../_components/card";
import {
  MINION_FACTORY_ADDRESS,
  WORTH_OF_WORDS_ADDRESS,
} from "../_lib/constants";
import {
  POINTS_FOR_FULL_WORD,
  POINTS_FOR_GREEN,
  POINTS_FOR_YELLOW,
} from "../_lib/lobbyPresets";
import { pluralize } from "../_lib/strings";

export default memo(function AboutPage(): ReactNode {
  return (
    <main className="flex min-h-screen w-full flex-col items-center pb-8 pt-4">
      <Card className="prose mx-4 flex max-w-4xl flex-col">
        <h2 className="self-center">About</h2>
        <p>
          <Link href="/">Return home</Link>
        </p>
        <h3>Game rules</h3>
        <h4>How to play</h4>
        <p>
          At the start of the game, each player chooses several secret words.
          Players will gain points by successfully guessing parts of their
          opponents&apos; secret words, and once all of a player&apos;s secret
          words are guessed that player is eliminated and can no longer gain
          points. When there is at most one player remaining, the player with
          the highest score wins. A player&apos;s first secret word must be
          fully guessed before any progress can be made on their second word,
          and so on.
        </p>
        <p>
          Worth of Words is played over a series of rounds. In each round, every
          remaining player is randomly assigned three opponents as
          &ldquo;targets.&rdquo; Simultaneously, each player chooses a{" "}
          <b>single</b> guess which will attempt to match against the current
          secret words of <b>all three</b> of their targets. (If there
          aren&apos;t enough players left to have three targets, then each
          player targets all remaining opponents instead.)
        </p>
        <p>
          After all players have made guesses (or the round timer has run out),
          all matches are revealed in the style of Wordle. Letters in the guess
          which are in the correct position in the secret word are marked green,
          while letters in the guess which are in the secret word but at a
          different position are marked yellow. Players are awarded points based
          on how good their guesses were, and play proceeds to the next round.
        </p>
        <p>
          All guesses made by any player and the resulting matches are public
          and can be used by any player to inform their guesses in future
          rounds.
        </p>
        <h4>Scoring</h4>
        <p>A guess earns points by revealing new information.</p>
        <ul>
          <li>
            A green match grants points if it is in a position which has not yet
            had a green match. Each new green match is worth{" "}
            <b>{pluralize(POINTS_FOR_GREEN, "point")}.</b>
          </li>
          <li>
            A yellow match grants points if it reveals that there are more
            instances of a given letter than were previously known. For example,
            if previous guesses indicated that the letter D appears in the word
            at least once and the new guess has two D&apos;s marked yellow, then
            points would be awarded for a single new yellow. Each new yellow
            match is worth <b>{pluralize(POINTS_FOR_YELLOW, "point")}.</b>
          </li>
        </ul>
        <p>
          Further, a guess that correctly guesses a full word is awarded an
          additional <b>{pluralize(POINTS_FOR_FULL_WORD, "point")}</b>.
        </p>
        <h3>Implementation</h3>
        <p>
          Worth of Words is fully decentralized and trustless. All communication
          between players occurs via the blockchain.
        </p>
        <h4>Zero-knowledge proofs</h4>
        <p>
          Data written to the blockchain is completely public, which is a
          challenge for a game based on hidden information. To avoid leaking
          everyone&apos;s secret words, Worth of Words uses zero-knowledge
          proofs to allow players to prove that they are playing correctly
          without revealing their secrets. Zero-knowledge proofs are used in two
          places:
        </p>
        <ul>
          <li>
            When a player chooses their secret words when joining a lobby, they
            must prove that the words they have chosen are actual English words,
            and not just random letters.
          </li>
          <li>
            Once players have made their guesses, each player must reveal the
            color matches for the guesses made against them, and must prove they
            are telling the truth about which colors are where.
          </li>
        </ul>
        <p>
          The ZK-circuits are written in{" "}
          <Link href="https://docs.circom.io/">Circom</Link> with proof
          generation and verification from{" "}
          <Link href="https://github.com/iden3/snarkjs">SnarkJS</Link>.
        </p>
        <h4>Minion Accounts</h4>
        <p>
          If you played Worth of Words used your primary account, it would
          require multiple security prompts per round to authorize actions.
          Instead, we use a message signed by the player to generate a private
          key for a &ldquo;minion account,&rdquo; a smart contract account with
          very little permissions. The minion account holds native tokens to pay
          for gas, but the only actions it can take are to make moves in Worth
          of Words and to return its balance to its owner. Thus, Worth of Words
          can store the minion&apos;s private key in the browser&apos;s local
          storage. This would normally be extremely insecure, but since this key
          has very limited permissions, if it were to leak the attacker could do
          very little.
        </p>
        <h4>Are Minion Accounts really secure?</h4>
        <p>
          Well actually, no. An attacker who steals the private key to a minion
          account can steal all its funds by signing a user operation with
          extremely high gas fees, then manually sending it to the entry point
          with themselves as the beneficiary (recipient of gas fees). This will
          be improved in the future by giving the minion account a gas spend
          limit per game. But all you can lose for now is testnet native tokens,
          so it&apos;s not so bad.
        </p>
        <h3>Deployed contracts</h3>
        <ul>
          <li>
            Gameplay contract:{" "}
            {getPolygonscanMumbaiLink(WORTH_OF_WORDS_ADDRESS)}
          </li>
          <li>
            Minion account contract:{" "}
            {getPolygonscanMumbaiLink(MINION_FACTORY_ADDRESS)}
          </li>
        </ul>
        <h3>License</h3>
        <p>
          Worth of Words is licensed under GPL-3.0. The source code is available
          on{" "}
          <Link href="https://github.com/dphilipson/worth-of-words">
            GitHub
          </Link>
          .
        </p>
        <p>
          <Link href="/">Return home</Link>
        </p>
      </Card>
    </main>
  );
});

function getPolygonscanMumbaiLink(address: Address): ReactNode {
  return <Link href={getPolygonscanMumbaiAddress(address)}>{address}</Link>;
}

function getPolygonscanMumbaiAddress(address: Address): string {
  return `https://mumbai.polygonscan.com/address/${address}`;
}
