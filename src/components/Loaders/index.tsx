import { FC } from "react";
import Lottie from "lottie-react";
import animationDataWhite from "../../assets/images/loading-white.json";
import animationDataBlack from "../../assets/images/loading-black.json";

type LoaderProps = {
  size?: number | string;          // ej. 100 o "100%"
  color?: "white" | "black";       // forzamos a estos valores
  backgroundColor?: string;        // ej. "#000" o "transparent"
  loop?: boolean;
};

const Loader: FC<LoaderProps> = ({
  size = "100%",
  color = "black",
  backgroundColor = "transparent",
  loop = true,
}) => {
  // Elegir animación según color
  const animationData =
    color === "white" ? animationDataWhite : animationDataBlack;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor, // ⬅️ fondo dinámico
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