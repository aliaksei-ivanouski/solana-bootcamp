import { ActionGetResponse, ACTIONS_CORS_HEADERS, ActionPostRequest, createPostResponse } from "@solana/actions";
import { Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, VoteAccount } from "@solana/web3.js";
import { Votingdapp } from "../../../../anchor/target/types/votingdapp";

const IDL = require("../../../../anchor/target/idl/votingdapp.json");

export const OPTIONS = GET;

/// Go to browser and click on the link to vote for crunchy or smooth
/// https://dial.to/?action=solana-action:http://localhost:3000/api/vote
export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://cookieandkate.com/images/2025/01/peanut-butter-recipe.jpg",
    title: "Vote for your favorite pinut butter",
    description: "Vote between crunchy and smooth peanut butter",
    label: "Vote",
    links: {
      actions: [
        {
          href: "/api/vote?candidate=Crunchy",
          label: "Crunchy",
          type: "transaction",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Smooth",
          type: "transaction",
        },
      ],
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate !== "Crunchy" && candidate !== "Smooth") {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program = new Program<Votingdapp>(IDL, { connection });

  const body: ActionPostRequest = await request.json();
  let voter;
  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid account", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const instruction = await program.methods.vote(
    candidate,
    new BN(1),
  ).accounts({
    signer: voter,
  }).instruction();

  const blockhash = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    }
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}