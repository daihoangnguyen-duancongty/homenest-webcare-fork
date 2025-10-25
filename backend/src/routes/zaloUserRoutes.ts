import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { getUserProfileV4 } from '../services/zaloUserService';

const router = Router();

// /login → redirect Zalo OAuth V4
router.get('/login', (req: Request, res: Response) => {
  const appId = process.env.ZALO_APP_ID!;
  const redirectUri = encodeURIComponent(`${process.env.BASE_URL}/api/zalo-user/callback`);

  const codeVerifier = crypto.randomBytes(32).toString('hex').slice(0, 43);
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest().toString('base64url');
  const state = crypto.randomBytes(8).toString('hex');

  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  const authUrl = `https://oauth.zaloapp.com/v4/permission?app_id=${appId}&redirect_uri=${redirectUri}&code_challenge=${codeChallenge}&state=${state}`;
  res.redirect(authUrl);
});

// /callback → nhận code → lấy User Access Token → fetch profile
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query;
  const sessionState = req.session.state;
  const codeVerifier = req.session.codeVerifier;

  if (!codeVerifier || !sessionState || state !== sessionState) {
    res.status(400).send('Invalid state or missing session data');
    return;
  }

  try {
    const response = await axios.post(
      'https://oauth.zaloapp.com/v4/access_token',
      new URLSearchParams({
        code: code as string,
        app_id: process.env.ZALO_APP_ID!,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          secret_key: process.env.ZALO_APP_SECRET!,
        },
      }
    );

    const data = response.data;
    console.log('✅ User Access Token V4:', data.access_token);

    const profile = await getUserProfileV4(data.access_token);
    console.log('✅ User profile V4:', profile);

    res.json({ access_token: data.access_token, profile });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi khi lấy User Access Token');
  }
});


export default router;
