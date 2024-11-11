import { init, fetchQueryWithPagination } from "@airstack/node";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("AIRSTACK_API_KEY is not defined");
}
init(apiKey);

console.log("Airstack API initialized for Null Followers count");

const nullFollowerQuery = `
query followBack($fid: Identity!) {
  SocialFollowings(
    input: {filter: {identity: {_eq: $fid}}, blockchain: ALL, limit: 200}
  ) {
    Following {
      followingAddress {
        socials {
          userId
          profileName
        }
        socialFollowers(
          input: {filter: {identity: {_eq: $fid}}, limit: 200}
        ) {
          Follower {
            followerSince
          }
        }
      }
    }
  }
}
`;

export async function GET(req: NextRequest) {
  console.log(`Null Followers API route called at ${new Date().toISOString()}`);
  console.log(`Full URL: ${req.url}`);

  const fid = req.nextUrl.searchParams.get("userId");
  console.log(`Requested userId in fb: ${fid}`);

  if (!fid) {
    console.log("Error: userId parameter is missing");
    return NextResponse.json(
      { error: "userId parameter is required" },
      { status: 400 }
    );
  }

  let nullFollowerCount = 0;
  let count = 0;
  let response: any;

  try {
    console.log(`Fetching Null Followers count from Airstack`);

    // Initialize response at the beginning
    response = await fetchQueryWithPagination(nullFollowerQuery, { fid: `fc_fid:${fid}` });

    // Ensure response is not null before proceeding
    while (response) {
      const { data, error, hasNextPage, getNextPage } = response;

      if (error) {
        console.error("Airstack API error (null followers data):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Check if data exists before accessing it
      if (data?.SocialFollowings?.Following) {
        // Count entries where Follower is null
        const currentPageNullFollowersCount = data.SocialFollowings.Following.filter(
          (followingEntry: any) => followingEntry.followingAddress.socialFollowers.Follower === null
        ).length;

        nullFollowerCount += currentPageNullFollowersCount;

        console.log(`Page ${count + 1} nullFollowerCount:`, currentPageNullFollowersCount);

        count++;
      }

      // If there's no next page, exit the loop
      if (!hasNextPage) {
        break;
      }

      // Fetch the next page
      response = await getNextPage();
    }

    console.log("Total nullFollowerCount:", nullFollowerCount);

    return NextResponse.json({
      nullFollowerCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
