import { useMemo } from "react";

import IconGlobe from "./icons/IconGlobe";
import IconAmazon from "./icons/IconAmazon";
import IconShopping from "./icons/IconShopping";
import IconTwitch from "./icons/IconTwitch";
import IconBook from "./icons/IconBook";
import IconDiscord from "./icons/IconDiscord";
import IconTwitter from "./icons/IconTwitter";

import useChannel from "../hooks/useChannel";

import Card from "./Card";
import IconTikTok from "./icons/IconTikTok";
import IconYouTube from "./icons/IconYoutube";
import IconCamera from "./icons/IconCamera";

const socialClass =
  "transition-[color,transform,scale] hover:scale-125 focus:scale-125 hover:text-highlight focus:text-highlight dark:hover:text-highlight-dark dark:focus:text-highlight-dark";

interface WelcomeProps {
  className?: string;
}

export default function Welcome(props: WelcomeProps) {
  const { className } = props;

  const channel = useChannel();
  const nonDefault = useMemo(
    () => !channel || channel.toLowerCase() !== "ferretsoftware",
    [channel],
  );

  return (
    <Card className={className} title="Welcome to Snails House">
      <p className="mt-2 mb-4">
        Snails House is a ferret rescue based out of Washington State which
        cares for animals brought in from all over the United States. We
        specifically seek out animals which have dire medical needs, are victims
        of abuse or neglect, or cannot otherwise be taken care of by their
        owners. We do not adopt animals out and do not accept donations of any
        kind as this is not a charity.
      </p>

      <ul className="mb-2 flex flex-wrap items-center justify-center gap-4">
        <li className={socialClass}>
          <a
            href="https://ferrets.live"
            rel="noreferrer"
            target="_blank"
            title="Website"
          >
            <IconGlobe size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://ferrets.piratesoftware.wiki"
            rel="noreferrer"
            target="_blank"
            title="Ferret Wiki"
          >
            <IconBook size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://discord.gg/piratesoftware"
            rel="noreferrer"
            target="_blank"
            title="Discord"
          >
            <IconDiscord size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://www.amazon.com/hz/wishlist/ls/XPF1IXTBF72H"
            rel="noreferrer"
            target="_blank"
            title="Amazon Wishlist"
          >
            <IconAmazon size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://throne.com/piratesoftware"
            rel="noreferrer"
            target="_blank"
            title="Throne Wishlist"
          >
            <IconShopping size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://x.com/FerretsLive"
            rel="noreferrer"
            target="_blank"
            title="Official Twitter"
          >
            <IconTwitter size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://x.com/ferretposting"
            rel="noreferrer"
            target="_blank"
            title="Shaye's Ferret Pics Twitter"
          >
            <IconCamera size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://tiktok.com/@ferretslive"
            rel="noreferrer"
            target="_blank"
            title="Ferrets on TikTok"
          >
            <IconTikTok size={32} />
          </a>
        </li>
        <li className={socialClass}>
          <a
            href="https://www.youtube.com/@FerretsLive"
            rel="noreferrer"
            target="_blank"
            title="YouTube Streams and Shorts"
          >
            <IconYouTube size={32} />
          </a>
        </li>
        {nonDefault && (
          <li className={socialClass}>
            <a
              href="https://twitch.tv/ferretsoftware"
              rel="noreferrer"
              target="_blank"
              title="Live"
            >
              <IconTwitch size={32} />
            </a>
          </li>
        )}
      </ul>

      {/* <a
        className="flex w-fit items-center justify-center gap-1 text-xs transition-colors hover:text-highlight focus:text-highlight"
        href="https://github.com/pirate-software/fs-extension"
        rel="noreferrer"
        target="_blank"
      >
        Contribute on GitHub
        <IconGitHub size={16} />
      </a> */}
    </Card>
  );
}
