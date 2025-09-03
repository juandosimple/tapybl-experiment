import { FC } from "react";
import Lottie from "lottie-react";
import animationData from "../../assets/images/loading.json";

type LoaderProps = {
  size?: number;
  loop?: boolean;
};

const Loader: FC<LoaderProps> = ({ size = "100%", loop = true }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay
        style={{ width: "50%", height: "50%" }}
      />
    </div>
  );
};

export default Loader;