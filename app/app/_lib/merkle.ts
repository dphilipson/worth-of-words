import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { newOneTimeLoader } from "./loading";
import { getSecretWordlist } from "./words";

export function useSecretWordMerkleTree(): UseQueryResult<MerkleTree> {
  return useQuery({
    queryKey: ["secret-word-merkle-tree"],
    queryFn: getSecretWordMerkleTree,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export const getSecretWordMerkleTree = newOneTimeLoader(
  async (): Promise<MerkleTree> => {
    const [wordlist, tree] = await Promise.all([
      getSecretWordlist(),
      loadTree(),
    ]);
    return new MerkleTree(wordlist, tree);
  }
);

export interface MerkleProof {
  proofHashes: string[];
  proofOrderings: number[];
}

export class MerkleTree {
  public readonly root: bigint;
  private readonly indexesByWord = new Map<string, number>();
  private readonly tree: string[];

  constructor(wordlist: string[], tree: string[]) {
    this.root = BigInt(tree[0]);
    wordlist.forEach((word, i) => this.indexesByWord.set(word, i));
    // Inserting an element at the start makes indexing math *much* easier.
    tree.unshift(undefined!);
    this.tree = tree;
  }

  public getIndex(word: string): number | undefined {
    return this.indexesByWord.get(word);
  }

  public getProof(index: number): MerkleProof {
    const proofHashes: string[] = [];
    const proofOrderings: number[] = [];
    for (let i = index + this.tree.length / 2; i > 1; i >>= 1) {
      proofHashes.push(this.tree[i ^ 1]);
      proofOrderings.push(i & 1);
    }
    return { proofHashes, proofOrderings };
  }
}

async function loadTree(): Promise<string[]> {
  const response = await fetch("./generated/secret-wordlist-tree.json");
  return response.json();
}
