export declare namespace Api {
  interface signType {
    credentials: {
      tmpSecretId: string;
      tmpSecretKey: string;
      sessionToken: string;
    };
    expiredTime: string;
  }

  interface menuType {
    announcement: {
      message: string;
      photoUrl: string;
    };
    album: {
      enable: boolean;
      bindName: string;
      bindEvent: string;
    };
  }
}
