export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  tvgId: string;
}

export interface PlaylistData {
  channels: Channel[];
  categories: string[];
}
