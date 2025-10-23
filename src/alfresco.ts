import axios, { AxiosInstance } from 'axios';

export class Alfresco {
  private ax: AxiosInstance;
  private ticket?: string;

  constructor(private baseUrl: string, private authMode: 'ticket'|'bearer', private creds: {
    username?: string; password?: string; bearer?: string;
  }) {
    this.ax = axios.create({ baseURL: baseUrl, timeout: 30000 });
  }

  async auth() {
    if (this.authMode === 'bearer') {
      this.ax.defaults.headers.common['Authorization'] = `Bearer ${this.creds.bearer!}`;
      return;
    }
    const res = await this.ax.post('/alfresco/api/-default-/public/authentication/versions/1/tickets', {
      userId: this.creds.username, password: this.creds.password
    });
    this.ticket = res.data?.entry?.id;
    if (!this.ticket) throw new Error('Could not get ticket');
  }

  contentUrl(nodeId: string) {
    const path = `/alfresco/api/-default-/public/alfresco/versions/1/nodes/${nodeId}/content`;
    if (this.authMode === 'bearer') return `${this.baseUrl}${path}`;
    return `${this.baseUrl}${path}?alf_ticket=${this.ticket}`;
  }

  async getNode(nodeId: string) {
    const res = await this.ax.get(`/alfresco/api/-default-/public/alfresco/versions/1/nodes/${nodeId}`, {
      params: this.authMode === 'ticket' ? { alf_ticket: this.ticket } : {}
    });
    return res.data.entry;
  }

  async uploadChild(parentId: string, name: string, bytes: Buffer, props: Record<string, any> = {}) {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('filedata', bytes, { filename: name });
    form.append('name', name);
    form.append('nodeType', 'cm:content');
    Object.entries(props).forEach(([k, v]) => form.append(`cm:${k}`, String(v)));

    const res = await this.ax.post(
      `/alfresco/api/-default-/public/alfresco/versions/1/nodes/${parentId}/children`,
      form,
      {
        headers: form.getHeaders(),
        params: this.authMode === 'ticket' ? { alf_ticket: this.ticket } : {}
      }
    );
    return res.data.entry.id as string;
  }

  async setProperties(nodeId: string, properties: Record<string, any>) {
    await this.ax.put(`/alfresco/api/-default-/public/alfresco/versions/1/nodes/${nodeId}`,
      { properties },
      { params: this.authMode === 'ticket' ? { alf_ticket: this.ticket } : {} }
    );
  }
}
