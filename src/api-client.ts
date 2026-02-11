import axios, { AxiosInstance } from "axios";
import type {
  VersionResponse,
  ChannelResponse,
  FfmpegProfile,
} from "./types.js";

export class ErsatzTVClient {
  private http: AxiosInstance;
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      headers: { Accept: "application/json" },
    });
  }

  async getVersion(): Promise<VersionResponse> {
    const { data } = await this.http.get<VersionResponse>("/api/version");
    return data;
  }

  async getChannels(): Promise<ChannelResponse[]> {
    const { data } = await this.http.get<ChannelResponse[]>("/api/channels");
    return data;
  }

  async getFfmpegProfiles(): Promise<FfmpegProfile[]> {
    const { data } = await this.http.get<FfmpegProfile[]>("/api/ffmpeg/profiles");
    return data;
  }

  async getM3uRaw(): Promise<string> {
    const { data } = await this.http.get<string>("/iptv/channels.m3u", {
      headers: { Accept: "text/plain" },
      responseType: "text",
    });
    return data;
  }

  async getXmltvRaw(): Promise<string> {
    const { data } = await this.http.get<string>("/iptv/xmltv.xml", {
      headers: { Accept: "application/xml" },
      responseType: "text",
    });
    return data;
  }
}
