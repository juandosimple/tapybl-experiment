export type Microlesson = {
  id: string;
  title: string;
  description: string | null;
  poster: string | null;               // imagen portada (si existe)
  statusString: string;                // "ACTIVE", etc.
  dateCreated: string;                 // ISO
  dateUpdated: string;                 // ISO
  lessonContentId: string;                 // ISO
  // ...otros campos si los necesitás
};

export type MicrolessonListResponse = {
  data: Microlesson[];
  pagesCount: number;
};