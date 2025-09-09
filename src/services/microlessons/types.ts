export type Microlesson = {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  poster: string | null;
  statusString: string;
  dateCreated: string;
  dateUpdated: string;
  lessonContentId: string;
};

export type MicrolessonListResponse = {
  data: Microlesson[];
  pagesCount: number;
};
