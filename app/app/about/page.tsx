import Link from "next/link";
import { memo, ReactNode } from "react";

import BlockExplorerLink from "../_components/blockExplorerLink";
import Card from "../_components/card";
import {
  ABOUT_AA_SDK_URL,
  ABOUT_ACCOUNT_KIT_URL,
  ABOUT_BUNDLER_URL,
  ABOUT_GAS_MANAGER_URL,
  ABOUT_MODULAR_ACCOUNTS_URL,
  ABOUT_ZERO_KNOWLEDGE_PROOFS_URL,
  MSCA_FACTORY_ADDRESS,
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
    <Card className="prose mx-4 mb-8 mt-4 flex max-w-4xl flex-col">
      <h2 className="self-center">About</h2>
      <p>
        <Link href="/">Return home</Link>
      </p>
      <h3>Game rules</h3>
      <h4>How to play</h4>
      <p>
        At the start of the game, each player chooses two secret words. Players
        gain points by successfully guessing parts of their opponents&apos;
        secret words. Once all of a player&apos;s secret words are guessed, that
        player is eliminated and can no longer gain points. When there is at
        most one player remaining, the player with the highest score wins.
      </p>
      <p>
        Worth of Words is played over a series of rounds. In each round, every
        remaining player is randomly assigned three opponents as
        &ldquo;targets.&rdquo; Simultaneously, each player chooses a{" "}
        <b>single</b> guess which will attempt to match against the current
        secret words of <b>all three</b> of their targets. (If there aren&apos;t
        enough players left to have three targets, then each player targets all
        remaining opponents instead.)
      </p>
      <p>
        After all players have made guesses, all matches are revealed in the
        style of Wordle. Letters in the guess which are in the correct position
        in the secret word are marked green, while letters in the guess which
        are in the secret word but at a different position are marked yellow.
        Players are awarded points based on how good their guesses were, and
        play proceeds to the next round.
      </p>
      <p>
        All guesses made by any player and the resulting matches are public.
      </p>
      <h4>Scoring</h4>
      <p>A guess earns points by revealing new information.</p>
      <ul>
        <li>
          A green match earns points if it is in a position which has not yet
          had a green match. Each new green match is worth{" "}
          <b>{pluralize(POINTS_FOR_GREEN, "point")}.</b>
        </li>
        <li>
          A yellow match earns points if it reveals that there are more
          instances of a given letter than were previously known. For example,
          if previous guesses indicated that the letter D appears in the word at
          least once and the new guess has two D&apos;s marked yellow, then
          points would be awarded for a single new yellow. Each new yellow match
          is worth <b>{pluralize(POINTS_FOR_YELLOW, "point")}.</b>
        </li>
      </ul>
      <p>
        Further, a guess that correctly guesses a full word earns an additional{" "}
        <b>{pluralize(POINTS_FOR_FULL_WORD, "point")}</b>.
      </p>
      <h4>What words are valid?</h4>
      <p>
        Worth of Words uses the same word lists as standard Wordle. Like in
        Wordle, the list of words which can be used as a secret is much smaller
        than the list of words which can be used as a guess. The word lists are
        available here: <a href="/secret-wordlist.txt">allowed secrets</a>,{" "}
        <a href="/guess-wordlist.txt">allowed guesses</a>.
      </p>
      <h4>Is there a maximum number of players?</h4>
      <p>
        No! Any number of players can join the same game, and the game length
        should not be significantly longer with more players.
      </p>
      <h3>Implementation</h3>
      <p>
        Worth of Words is fully decentralized and trustless. All in-game actions
        and all communication between players occur via the blockchain.
      </p>
      <h4>Modular Accounts</h4>
      <p>
        Behind the scenes, each player is given a{" "}
        <a href={ABOUT_MODULAR_ACCOUNTS_URL}>Modular Account</a>, a smart
        contract account developed by Alchemy that allows developers and users
        to customize their account features using <b>plugins</b>.
      </p>
      <p>
        Worth of Words&apos;s accounts use a <b>session key plugin</b> to create
        frontend session keys, so users can securely take many on-chain actions
        throughout a game without clicking through a security prompt each time.
      </p>
      <h4>Gas Manager</h4>
      <p>
        Although gameplay takes place fully on-chain, players are never required
        to spend their own money to pay for transactions. This is possible
        through Alchemy&apos;s <a href={ABOUT_GAS_MANAGER_URL}>Gas Manager</a>,
        a smart contract that allows Worth of Words to sponsor users so they
        play without using their own money to put actions on the blockchain.
      </p>
      <h4>Account Kit</h4>
      <p>
        Modular Accounts and the Gas Manager are both part of{" "}
        <a href={ABOUT_ACCOUNT_KIT_URL}>Account Kit</a>, Alchemy&apos;s
        framework for building applications with embedded accounts. In addition
        to the above, Worth of Words also uses Account Kit&apos;s{" "}
        <a href={ABOUT_AA_SDK_URL}>aa-sdk</a> for working with smart accounts
        and its <a href={ABOUT_BUNDLER_URL}>Bundler API</a> for submitting
        operations to the blockchain.
      </p>
      <h4 id="zero-knowledge-proofs">Zero-knowledge proofs</h4>
      <p>
        Data written to the blockchain is completely public, which is a
        challenge for a game based on hidden information. To avoid leaking
        everyone&apos;s secret words, Worth of Words uses{" "}
        <a href={ABOUT_ZERO_KNOWLEDGE_PROOFS_URL}>zero-knowledge proofs</a> to
        allow players to prove that they are playing correctly without revealing
        their secrets. Zero-knowledge proofs are used in two places:
      </p>
      <ul>
        <li>
          When a player chooses their secret words when joining a lobby, they
          must prove that the words they have chosen are real English words, and
          not just random letters.
        </li>
        <li>
          Once players have made their guesses, each player must reveal the
          color matches for the guesses made against them, and must prove they
          are telling the truth about which colors are where.
        </li>
      </ul>
      <p>
        The ZK-circuits are written in{" "}
        <Link href="https://docs.circom.io/">Circom</Link> with proof generation
        and verification from{" "}
        <Link href="https://github.com/iden3/snarkjs">SnarkJS</Link>.
      </p>
      <h3>Contracts</h3>
      <ul>
        <li>
          Worth of Words: <BlockExplorerLink address={WORTH_OF_WORDS_ADDRESS} />
        </li>
        <li>
          Modular Account factory:{" "}
          <BlockExplorerLink address={MSCA_FACTORY_ADDRESS} />
        </li>
      </ul>
      <h3>License</h3>
      <p>
        Worth of Words is licensed under GPL-3.0. The source code is available
        on{" "}
        <Link href="https://github.com/dphilipson/worth-of-words">GitHub</Link>.
      </p>
      <p>
        &ldquo;Wordle&rdquo; is a registered trademark of The New York Times
        Company. Worth of Words is not affiliated with or sponsored by The New
        York Times Company in any way.
      </p>
      <p>Copyright © 2024 David Philipson</p>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </Card>
  );
});
