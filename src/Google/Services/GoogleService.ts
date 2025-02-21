import { Injectable } from '@nestjs/common';
import { docs_v1, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CreateDocDto } from '../Dtos/CreateDoc.dto';

// Load the credentials JSON file you downloaded
const credentials = JSON.parse(
  `{"web":{"client_id":"849547651496-hmcu62nm6mis18tptl7ksq6gotdkrlia.apps.googleusercontent.com","project_id":"teambitwise","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["http://localhost:3000/api/google/authenticate"],"javascript_origins":["http://localhost:3000"]}}`,
);

@Injectable()
export class GoogleService {
  private docs: docs_v1.Docs; // Google Docs API client
  private oauth2Client: OAuth2Client;
  constructor() {
    // Create an OAuth2 client
    this.oauth2Client = new google.auth.OAuth2({
      clientId: credentials.web.client_id,
      clientSecret: credentials.web.client_secret,
      redirectUri: credentials.web.redirect_uris[0], // Redirect URI (if applicable)
    });

    google.options({ auth: this.oauth2Client });
  }

  public async initiateAuthentication() {
    // Access scopes for read-only Drive activity.
    const scopes = ['https://www.googleapis.com/auth/drive'];

    // Generate a url that asks permissions for the Drive activity scope
    const authorizationUrl = this.oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      /** Pass in the scopes array defined above.
       * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: scopes,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,
    });

    console.log(`auth url: ${authorizationUrl}`);
    return authorizationUrl;
  }

  public async authenticate(authCode: string) {
    // This will provide an object with the access_token and refresh_token.
    // Save these somewhere safe so they can be used at a later time.
    const { tokens } = await this.oauth2Client.getToken(authCode);

    // Set the credentials for the OAuth2 client
    this.oauth2Client.setCredentials(tokens);
  }

  public async createDoc(input: CreateDocDto) {
    // Initialize the Google Docs API client
    if (!this.docs) {
      this.docs = google.docs({
        version: 'v1', // Version of the Google Docs API
        auth: this.oauth2Client,
      });
    }

    const result = await this.docs.documents.create({
      requestBody: {
        title: input.name,
      },
    });
    return result;
  }
}