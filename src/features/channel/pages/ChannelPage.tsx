// src/features/channel/pages/ChannelPage.tsx
import { useParams } from "react-router-dom";
import OrganizationAvatar from "@/components/avatar/OrganizationAvatar";
import styles from "./ChannelPage.module.css";
import { Tabs, Tab } from "react-bootstrap";
import { useState } from "react";
import img1 from "@/assets/images/mock/image-01.png"; // o .jpg
import img2 from "@/assets/images/mock/image-02.png"; // o .jpg
import img3 from "@/assets/images/mock/image-03.png"; // o .jpg
import img11 from "@/assets/images/mock/image-04.png"; // o .jpg
import img4 from "@/assets/images/mock/img-4.png"; // o .jpg
import img5 from "@/assets/images/mock/img-5.jpg"; // o .jpg
import img6 from "@/assets/images/mock/img-6.png"; // o .jpg
import img7 from "@/assets/images/mock/img-7.jpg"; // o .jpg
import img8 from "@/assets/images/mock/img-8.jpg"; // o .jpg
import img9 from "@/assets/images/mock/img-9.jpg"; // o .jpg
import img10 from "@/assets/images/mock/img-10.jpg"; // o .jpg

import {
  VideoCameraIcon,
  PaperAirplaneIcon,
  Squares2X2Icon,
  BookmarkIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { url } from "inspector";

export default function ChannelPage() {
  const { organization_id } = useParams<{ organization_id: string }>();
  const [key, setKey] = useState<string>("gallery");

  function EmptyState({ title, text }: { title: string; text: string }) {
    return (
      <div
        style={{
          color: "#bbb",
          textAlign: "center",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img11})` }}
        >
        </div>
      </div>
    );
  }
  function Gallery() {
    return (
      <div
        style={{
          color: "#bbb",
          textAlign: "center",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img5})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img4})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img6})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img7})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img8})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img9})` }}
        >
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img10})` }}
        >
        </div>
      </div>
    );
  }
  function Progress() {
    return (
      <div
        style={{
          color: "#bbb",
          textAlign: "center",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img1})` }}
        >
          <span className={styles["profile_gallery_image_span"]}>43% done</span>
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img2})` }}
        >
          <span className={styles["profile_gallery_image_span"]}>
            Completed!
          </span>
        </div>
        <div
          className={styles["profile_gallery_image_container"]}
          style={{ backgroundImage: `url(${img3})` }}
        >
          <span className={styles["profile_gallery_image_span"]}>10% done</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 24, color: "#000" }}>
        <OrganizationAvatar
          size={100}
          showName={false}
          className={styles["profile_avatar_2"]}
        />
        <span
          style={{
            fontWeight: "bold",
            fontSize: 18,
            textAlign: "center",
            display: "block",
          }}
        >
          iamproperty
        </span>
        <p style={{ fontWeight: "500", textAlign: "center" }}>
          Transforming Estate Agency with Next Gen Solutions
        </p>
        <p style={{ fontWeight: "500", textAlign: "center" }}>
          <a href="#" style={{ color: "#000" }}>
            https://iamproperty.com/
          </a>
        </p>
      </div>
      <div className={styles["profile_desc_grid"]}>
        <p>
          2K <span>Learners</span>
        </p>
        <p>
          120 <span>Lessons</span>
        </p>
        <p>
          43 <span>Challenges</span>
        </p>
      </div>
      <div className={styles.tabsWrap}>
        <Tabs
          id="profile-tabs"
          activeKey={key}
          onSelect={(k) => k && setKey(k)}
          justify
          variant="pills" // estilo mobile-friendly
          className={styles.tabs}
          mountOnEnter
          unmountOnExit
        >
          <Tab
            eventKey="gallery"
            title={
              <>
                <Squares2X2Icon />
              </>
            }
            tabClassName={styles.tab}
          >
            <section className={styles.panel}>
              {/* TODO: reemplazar con tu grid/lista real */}
              <Gallery />
            </section>
          </Tab>

          <Tab
            eventKey="progress"
            title={
              <>
                <AcademicCapIcon />
              </>
            }
            tabClassName={styles.tab}
          >
            <section className={styles.panel}>
              {/* TODO: renderiza tus recientes */}
              <Progress />
            </section>
          </Tab>

          <Tab
            eventKey="bookmarked"
            title={
              <>
                <BookmarkIcon />
              </>
            }
            tabClassName={styles.tab}
          >
            <section className={styles.panel}>
              {/* TODO: renderiza destacadas */}
              <EmptyState
                title="bookmarked"
                text="You can bookmark videos to quickly find and continue them later."
              />
            </section>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
