// src/features/channel/pages/ChannelPage.tsx
import { useParams } from "react-router-dom";
import OrganizationAvatar from "@/components/avatar/OrganizationAvatar";
import styles from "./ChannelPage.module.css";
import { Tabs, Tab } from "react-bootstrap";
import { useState } from "react";

export default function ChannelPage() {
  const { organization_id } = useParams<{ organization_id: string }>();
  const [key, setKey] = useState<string>("popular");

  function EmptyState({ title, text }: { title: string; text: string }) {
    return (
      <div style={{ padding: 16, color: "#bbb", textAlign: "center" }}>
        <div style={{ fontWeight: 600, color: "#fff", marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: 14 }}>{text}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 24, color: "#000" }}>
        <OrganizationAvatar
          size={48}
          showName
          className={styles["profile_avatar"]}
        />
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
            eventKey="popular"
            title="Most popular"
            tabClassName={styles.tab}
          >
            <section className={styles.panel}>
              {/* TODO: reemplazar con tu grid/lista real */}
              <EmptyState
                title="Most popular"
                text="The most viewed lessons will appear here."
              />
            </section>
          </Tab>

          <Tab eventKey="recent" title="Recent" tabClassName={styles.tab}>
            <section className={styles.panel}>
              {/* TODO: renderiza tus recientes */}
              <EmptyState
                title="Recent"
                text="Your most recent micro-lessons will appear here."
              />
            </section>
          </Tab>

          <Tab eventKey="featured" title="Featured" tabClassName={styles.tab}>
            <section className={styles.panel}>
              {/* TODO: renderiza destacadas */}
              <EmptyState
                title="Featured"
                text="Featured micro-lessons from the team will appear here."
              />
            </section>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
