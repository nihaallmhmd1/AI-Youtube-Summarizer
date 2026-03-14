export interface Summary {
  id: string;
  user_id: string;
  video_url: string;
  video_title: string;
  video_id: string;
  summary: string;
  key_points: string[];
  highlights: string[];
  key_takeaways: string[];
  detailed_summary?: string;
  points_oriented?: string[];
  timestamped_highlights?: string[];
  reading_mode?: {
    title: string;
    introduction: string;
    sections: { heading: string; content: string }[];
    conclusion: string;
  };
  created_at: string;
  // Optional frontend helper fields
  videoId?: string;
  title?: string;
}
