const clientId = "72cf538d311b43f993c231556b5edd24";
const redirectUri = "http://localhost:3000/";
const baseUrl = "https://api.spotify.com/v1";

let accessToken;

const Spotify = {
  getAcessToken() {
    if (accessToken) {
      return accessToken;
    }

    let accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    let expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      window.setTimeout(() => {
        accessToken = "";
      }, expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return accessToken;
    } else {
      let accessUrl = "https://accounts.spotify.com/authorize";
      accessUrl += `?client_id=${clientId}`;
      accessUrl += "&response_type=token";
      accessUrl += `&redirect_uri=${redirectUri}`;
      accessUrl += "&scope=playlist-modify-public";

      window.location = accessUrl;
    }
  },

  async search(term) {
    const accessToken = Spotify.getAcessToken();

    let searchEndpoint = baseUrl + "/search";
    searchEndpoint += `?q=${term}`;
    searchEndpoint += "&type=track";

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    try {
      const response = await fetch(searchEndpoint, {
        headers: headers,
      });

      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.tracks.items.map((track) => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri,
          };
        });
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
      return [];
    }
  },

  async savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      return;
    }

    const accessToken = Spotify.getAcessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    let userId;
    const profileEndpoint = baseUrl + "/me";

    try {
      const response = await fetch(profileEndpoint, {
        headers: headers,
      });
      if (response.ok) {
        const profileResponseJson = await response.json();
        userId = profileResponseJson.id;
      } else {
        return;
      }
    } catch (error) {
      console.log(error);
    }

    let playlistId;
    const createPlaylistEndpoint = baseUrl + `/users/${userId}/playlists`;

    try {
      const response = await fetch(createPlaylistEndpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ name: name }),
      });
      if (response.ok) {
        const createPlaylistResponseJson = await response.json();
        playlistId = createPlaylistResponseJson.id;
      } else {
        return;
      }
    } catch (error) {
      console.log(error);
    }

    const addTracksEndpoint = baseUrl + `/playlists/${playlistId}/tracks`;
    try {
      const response = await fetch(addTracksEndpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ uris: trackUris }),
      });

      if (response.ok) {
        return true;
      } else {
        return;
      }
    } catch (error) {
      console.log(error);
    }
  },
};

export { Spotify };
