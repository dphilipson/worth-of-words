import Link from "next/link";
import { memo, ReactNode } from "react";

import Card from "../_components/card";
import PolygonscanLink from "../_components/polygonscanLink";
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
    <Card className="prose mx-4 mb-8 mt-4 flex max-w-4xl flex-col">
      <h2 className="self-center">About</h2>
      <p>
        <Link href="/">Return home</Link>
      </p>
      <h3>Game rules</h3>
      <h4>How to play</h4>
      <p>
        At the start of the game, each player chooses several secret words.
        Players will gain points by successfully guessing parts of their
        opponents&apos; secret words. Once all of a player&apos;s secret words
        are guessed, that player is eliminated and can no longer gain points.
        When there is at most one player remaining, the player with the highest
        score wins.
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
        After all players have made guesses (or the round timer has run out),
        all matches are revealed in the style of Wordle. Letters in the guess
        which are in the correct position in the secret word are marked green,
        while letters in the guess which are in the secret word but at a
        different position are marked yellow. Players are awarded points based
        on how good their guesses were, and play proceeds to the next round.
      </p>
      <p>
        All guesses made by any player and the resulting matches are public and
        can be used by any player to inform their guesses in future rounds.
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
        Further, a guess that correctly guesses a full word is awarded an
        additional <b>{pluralize(POINTS_FOR_FULL_WORD, "point")}</b>.
      </p>
      <h4>What words are valid?</h4>
      <p>
        Worth of Words uses the same word lists as standard Wordle. Like in
        Wordle, the list of words which can be used as a secret is much smaller
        than the list of words which can be used as a guess. The word lists are
        available here: <Link href="/secret-wordlist.txt">allowed secrets</Link>
        , <Link href="/guess-wordlist.txt">allowed guesses</Link>.
      </p>
      <h4>Is there a maximum number of players?</h4>
      <p>
        No! Any number of players can join the same game, and the game length
        should not be significantly longer with more players.
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
        everyone&apos;s secret words, Worth of Words uses zero-knowledge proofs
        to allow players to prove that they are playing correctly without
        revealing their secrets. Zero-knowledge proofs are used in two places:
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
        <Link href="https://docs.circom.io/">Circom</Link> with proof generation
        and verification from{" "}
        <Link href="https://github.com/iden3/snarkjs">SnarkJS</Link>.
      </p>
      <h4 id="minion-accounts">Minion Accounts</h4>
      <p>
        If you played Worth of Words with your primary account, you would get
        multiple security prompts every round to authorize actions, which would
        be a very annoying experience. Instead, the player controls a separate
        &ldquo;minion account,&rdquo; a smart contract account with very limited
        permissions. The minion account holds native tokens to pay for gas, but
        the only actions it can take are to make moves in Worth of Words and to
        return its balance to its owner. Thus, Worth of Words can store the
        minion&apos;s private key in the browser&apos;s local storage. This
        would normally be extremely insecure, but since this key has very narrow
        scope, even if it leaked an attacker could do very little.
      </p>
      <p>
        The minion account&apos;s private key is generated from a message signed
        by the primary account, so you can regain access even if your browser
        storage is cleared.
      </p>
      <h4>Are Minion Accounts really secure?</h4>
      <p>
        Well actually, no. An attacker who steals the private key to a minion
        account can steal all its funds by signing a user operation with
        extremely high gas fees, then manually sending it to the entry point
        with themselves as the beneficiary (recipient of gas fees). This will be
        improved in the future by giving the minion account a gas spend limit
        per game. But since this app only uses testnet tokens for now, it&apos;s
        not so bad.
      </p>
      <h4>How much does it cost to play?</h4>
      <p>
        Worth of Words is deployed on the Polygon Mumbai test network, making it
        completely free. If it were deployed on Polygon mainnet, the gas fees
        would be roughly $0.15 per player per game.
      </p>
      <h3>Deployed contracts</h3>
      <ul>
        <li>
          Gameplay contract:{" "}
          <PolygonscanLink address={WORTH_OF_WORDS_ADDRESS} />
        </li>
        <li>
          Minion account contract:{" "}
          <PolygonscanLink address={MINION_FACTORY_ADDRESS} />
        </li>
      </ul>
      <h3>License</h3>
      <p>
        Worth of Words is licensed under GPL-3.0. The source code is available
        on{" "}
        <Link href="https://github.com/dphilipson/worth-of-words">GitHub</Link>.
      </p>
      <p>Copyright © 2023 David Philipson</p>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </Card>
  );
});
