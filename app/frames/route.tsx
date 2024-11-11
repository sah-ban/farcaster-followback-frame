import { Button } from "frames.js/next";
import { frames } from "./frames";
import { appURL, formatNumber } from "../utils";

interface State {
  lastFid?: string;
}

let nullFollowerCount: number = 0;

interface NullFollowerResponse {
  nullFollowerCount: number; 
}
const frameHandler = frames(async (ctx) => {
  interface UserData {
    name: string;
    username: string;
    fid: string;
    followingCount:number;
    profileDisplayName: string;
    profileImageUrl: string;
  }

  let userData: UserData | null = null;
  let followData: NullFollowerResponse | null = null;


  let error: string | null = null;
  let isLoading = false;

  const fetchUserData = async (fid: string) => {
    isLoading = true;
    try {
      const airstackUrl = `${appURL()}/api/profile?userId=${encodeURIComponent(
        fid
      )}`;
      const airstackResponse = await fetch(airstackUrl);
      if (!airstackResponse.ok) {
        throw new Error(
          `Airstack HTTP error! status: ${airstackResponse.status}`
        );
      }
      const airstackData = await airstackResponse.json();

      if (
        airstackData.userData.Socials.Social &&
        airstackData.userData.Socials.Social.length > 0
      ) {
        const social = airstackData.userData.Socials.Social[0];
        userData = {
          name: social.profileDisplayName || social.profileName || "Unknown",
          username: social.profileName || "unknown",
          fid: social.userId || "N/A",
          followingCount:social.followingCount || "N/A",
          profileDisplayName: social.profileDisplayName || "N/A",
          profileImageUrl:
            social.profileImageContentValue?.image?.extraSmall ||
            social.profileImage ||
            "",
        };
      } else {
        throw new Error("No user data found");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error = (err as Error).message;
    } finally {
      isLoading = false;
    }
  };

  const fetchFollowData = async (fid: string) => {
    try {
      const fbUrl = `${appURL()}/api/countFB?userId=${encodeURIComponent(
        fid
      )}`;
      const fbResponse = await fetch(fbUrl);
      if (!fbResponse.ok) {
        throw new Error(`Follow HTTP error! status: ${fbResponse.status}`);
      }
      followData = await fbResponse.json();
      let x=followData?.nullFollowerCount;
    } catch (err) {
      console.error("Error fetching Follow data:", err);
      error = (err as Error).message;
    }
    
  };

  const extractFid = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      let fid = parsedUrl.searchParams.get("userfid");

      console.log("Extracted FID from URL:", fid);
      return fid;
    } catch (e) {
      console.error("Error parsing URL:", e);
      return null;
    }
  };

  let fid: string | null = null;

  if (ctx.message?.requesterFid) {
    fid = ctx.message.requesterFid.toString();
    console.log("Using requester FID:", fid);
  } else if (ctx.url) {
    fid = extractFid(ctx.url.toString());
    console.log("Extracted FID from URL:", fid);
  } else {
    console.log("No ctx.url available");
  }

  if (!fid && (ctx.state as State)?.lastFid) {
    fid = (ctx.state as State).lastFid ?? null;
    console.log("Using FID from state:", fid);
  }

  console.log("Final FID used:", fid);

  const shouldFetchData =
    fid && (!userData || (userData as UserData).fid !== fid);

  if (shouldFetchData && fid) {
    await Promise.all([fetchUserData(fid), fetchFollowData(fid)]);
  }
  // console.log(NullFollowerResponse.nullFollowerCount)

  const SplashScreen = () => (
    <div tw="flex flex-col w-full h-full bg-[#8660cc] text-white font-sans">
    <div tw="flex rounded-lg items-center w-50 h-50 m-auto mt-20 overflow-hidden">
    <img
      
      src="https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/0eff1618-0790-4e82-fdf4-ebc3a2227400/original"
    />
</div>
      <div tw="flex text-5xl m-auto"><p>Check how many users are not </p></div>
      <div tw="flex text-5xl m-auto mb-20"><p>Following you Back</p></div>

    </div>
  );


  const ScoreScreen = () => {
    return (
      <div tw="flex flex-col w-full h-full bg-[#8660cc] text-white font-sans">
      
      <div tw="flex items-center justify-center mt-30">
            <img
              src={userData?.profileImageUrl}
              alt="Profile"
              tw="w-30 h-30 rounded-lg mr-4"
            />
            <div tw="flex flex-col">
              <span tw="flex text-5xl">{userData?.profileDisplayName}</span>
              <span tw="flex text-3xl">@{userData?.username}</span>
              

            </div>
       </div>
      
       <div tw="flex flex-col items-center">
       <div tw="flex flex-row mt-6">
       <span tw="flex text-7xl">{followData?.nullFollowerCount} </span>
       <span tw="flex text-5xl mt-4.3 ml-2">users</span>

       {/* <span tw="flex text-5xl mt-4.3">({(Number( followData?.nullFollowerCount/ (userData?.followingCount)) * 100).toFixed(1)}%)</span> */}
</div>
       <span tw="flex text-5xl"> are not following you back</span>

       </div>
       
       <div tw="flex bg-[#FFDEAD] mt-30 text-black w-full justify-end ">
          <div tw="flex text-3xl pr-20">frame by @cashlessman.eth</div>
        
        </div>
      </div>
    );
  };
  const shareText1 = encodeURIComponent(
    `Check how many users are not Following you Back \n \nframe by @cashlessman.eth`
);


  const shareText2 = encodeURIComponent(
    followData? `${(followData as NullFollowerResponse).nullFollowerCount} users are not following me back, \nCheck how many users are not Following you Back\n\nframe by @cashlessman.eth`
      : ""
  );
  const getList =  encodeURIComponent(
    `Hey @cashlessman.eth, can I get a list of users who are not following me back in my DMs? \nTip: 1 $DEGEN (incase my reply is hidden) `
);

 
  const shareUrl1 = `https://warpcast.com/~/compose?text=${shareText1}&embeds[]=https://moxiedemo.vercel.app/frames`;

  const shareUrl2 = `https://warpcast.com/~/compose?text=${shareText2}&embeds[]=https://moxiedemo.vercel.app/frames${
    fid ? `?userfid=${fid}` : ""
  }`;

  const shareUrl3 = `https://warpcast.com/~/compose?text=${getList}&parentCastHash=0x457c50102bb037a467039ed13c1e92ce514c3458`;

  const buttons = [];

  if (!userData) {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        Check Me
      </Button>,
      <Button
        action="link"
        // Change the url here
        target={shareUrl1}      >
        Share
      </Button>,
      <Button
        action="link"
        target="https://warpcast.com/cashlessman.eth"
      >
        @cashlessman.eth
      </Button>
    );
  } else {
    buttons.push(
      <Button action="post" target={{ href: `${appURL()}?userfid=${fid}` }}>
        Check Me
      </Button>,
      <Button action="link" target={shareUrl2}>
        Share
      </Button>,
      <Button
        action="link"
        target={shareUrl3}        >
      Get List
      </Button>,
         <Button
         action="link"
         target="https://warpcast.com/cashlessman.eth"
         >
        @cashlessman.eth
       </Button>
      
    );
  }

  return {
    image: fid && !error ? <ScoreScreen /> : <SplashScreen /> ,
    buttons: buttons,
  };
});

export const GET = frameHandler;
export const POST = frameHandler;
