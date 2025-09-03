import VideoSurface from "./VideoSurface";
import ProgressBar from "./ProgressBar";
import DefaultMenu from "./DefaultMenu";
import DefaultQuiz from "./DefaultQuiz";
import OverlayRoot from "./OverlayRoot";
import { useInteractiveVideoCore } from "./useInteractiveVideoCore";
import type { Graph } from "../utils/types";

export default function InteractiveVideoPlayer({
  graph,
  onClose,
  onEvent,
  renderMenu,
  renderQuiz,
}: {
  graph: Graph | null;
  onClose: () => void;
  onEvent?: Parameters<typeof useInteractiveVideoCore>[0]["onEvent"];
  renderMenu?: (menu: any, onSelect: (id:string)=>void) => React.ReactNode;
  renderQuiz?: (args:{ list:any; quizId:string; goToVideoNode:(id:string, n:any)=>void; setMenuId:(id:string|null)=>void; setQuizId:(id:string|null)=>void; }) => React.ReactNode;
}) {
  const { state, actions } = useInteractiveVideoCore({ graph, onEvent });
  const { loading, error, video, progress, overlays } = state;

  if (loading) return <OverlayRoot onClose={onClose}><div style={{color:"#aaa"}}>Loading...</div></OverlayRoot>;
  if (error)   return <OverlayRoot onClose={onClose}><div style={{color:"salmon"}}>{error}</div></OverlayRoot>;
  if (!video.baseUrl) return null;

  return (
    <OverlayRoot onClose={onClose}>
      <div style={{ width:"100%", maxWidth:900, display:"flex", flexDirection:"column", alignItems:"center",justifyContent:"center", position:"relative", height:"calc(100vh - 50px)" }}>
        <VideoSurface src={video.baseUrl} poster={video.poster} videoRef={video.ref} />
        <ProgressBar current={progress.segCurrent} duration={progress.segDuration} buffered={progress.bufferedEnd} />
      </div>

      {overlays.menu && (renderMenu
        ? renderMenu(overlays.menu, actions.onSelectOption)
        : <DefaultMenu menu={overlays.menu} onSelect={actions.onSelectOption} />
      )}

      {overlays.quizId && overlays.list && (renderQuiz
        ? renderQuiz({ list: overlays.list, quizId: overlays.quizId, goToVideoNode: actions.goToVideoNode, setMenuId: actions.setMenuId, setQuizId: actions.setQuizId })
        : <DefaultQuiz list={overlays.list} quizId={overlays.quizId} goToVideoNode={actions.goToVideoNode} setMenuId={actions.setMenuId} setQuizId={actions.setQuizId} />
      )}
    </OverlayRoot>
  );
}