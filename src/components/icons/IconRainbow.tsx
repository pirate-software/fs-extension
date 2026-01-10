// Modified by mattermatter.dev @ Pirate Software, 2025

import { BaseIcon, type IconProps } from "./BaseIcon";
import rainbowIcon from "../../assets/rainbow.png";

// Frame 12 of yarrWave
export default function IconRainbow(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 78 78" {...props}>
      <image href={rainbowIcon} width="78" height="78" x="0" y="0" />
    </BaseIcon>
  );
}
