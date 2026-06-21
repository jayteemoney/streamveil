import { useQuery } from "@tanstack/react-query";
import { readProvider, streamVeilContract, tokenContract } from "./contracts";
import { parseStream, Stream } from "./stream";

/** Fetch every stream where the address is sender or recipient. */
export function useStreams(address: string | null) {
  return useQuery<Stream[]>({
    queryKey: ["streams", address],
    enabled: !!address,
    refetchInterval: 15_000,
    queryFn: async () => {
      const sv = streamVeilContract(readProvider());
      const [asSender, asRecipient]: [bigint[], bigint[]] = await Promise.all([
        sv.streamsBySender(address),
        sv.streamsByRecipient(address),
      ]);
      const ids = Array.from(new Set([...asSender, ...asRecipient].map((x) => Number(x))));
      const now = Date.now();
      const streams = await Promise.all(
        ids.map(async (id) => parseStream(await sv.getStream(id), now)),
      );
      return streams.sort((a, b) => b.id - a.id);
    },
  });
}

/** The connected user's encrypted token balance handle (decrypt client-side to read it). */
export function useTokenBalanceHandle(address: string | null) {
  return useQuery<string>({
    queryKey: ["balance", address],
    enabled: !!address,
    refetchInterval: 15_000,
    queryFn: async () => {
      const token = tokenContract(readProvider());
      return token.confidentialBalanceOf(address);
    },
  });
}
