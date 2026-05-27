import nodemailer from 'nodemailer';
import { supabase } from '../config/db';
import { createLogger } from '../lib/logger';
import fs from 'fs';
import path from 'path';

const logger = createLogger('email-service');

// SMTP configuration from environment variables
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const fromEmail = process.env.FROM_EMAIL || 'chronicles@roomroll.co.in';

const transporter = smtpHost && smtpUser && smtpPass ? nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: smtpUser,
        pass: smtpPass
    }
}) : null;

export const sendWeeklyChronicles = async (): Promise<{ sentCount: number; loggedCount: number }> => {
    logger.info('Starting weekly email delivery run...');
    
    // 1. Fetch all registered users
    const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, display_name, email');
        
    if (usersErr || !users || users.length === 0) {
        logger.warn('No registered users found or error fetching users:', usersErr);
        return { sentCount: 0, loggedCount: 0 };
    }

    // 2. Fetch active campaigns and events to showcase dynamic content
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, description, world_type')
        .limit(3);
        
    const { data: worldEvents } = await supabase
        .from('campaign_world_events')
        .select('title, description')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

    const activeCampaignsHtml = campaigns && campaigns.length > 0
        ? campaigns.map((c: any) => `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(213, 180, 93, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                <h4 style="margin: 0 0 6px 0; color: #d5b45d; font-family: serif; font-size: 16px;">🏰 ${c.name}</h4>
                <p style="margin: 0; color: #cbc3b5; font-size: 13px; line-height: 1.5;">Setting: <strong>${c.world_type || 'Classic Fantasy'}</strong> - ${c.description || 'The adventure is unfolding...'}</p>
            </div>
          `).join('')
        : `<p style="color: #cbc3b5; font-style: italic; font-size: 13px;">No active campaigns currently, start yours today!</p>`;

    const activeEventsHtml = worldEvents && worldEvents.length > 0
        ? worldEvents.map((e: any) => `
            <li style="margin-bottom: 10px; color: #cbc3b5; font-size: 13px;">
                <strong style="color: #ea580c;">⚔️ ${e.title}</strong>: ${e.description || 'Something shifted in the leylines.'}
            </li>
          `).join('')
        : `<li style="color: #cbc3b5; font-style: italic; font-size: 13px;">The realm remains quiet... for now.</li>`;

    let sentCount = 0;
    let loggedCount = 0;

    // Ensure local sent_emails directory exists for fallback testing
    const scratchEmailsDir = path.join(__dirname, '../../scratch/sent_emails');
    if (!transporter) {
        fs.mkdirSync(scratchEmailsDir, { recursive: true });
    }

    for (const user of users) {
        const recipientName = user.display_name || 'Adventurer';
        const recipientEmail = user.email;

        // Build premium, responsive, HSL-harmonized HTML Newsletter
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Roomroll Chronicles</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5efe2;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #141210; border: 1px solid #2e261f; border-radius: 20px; overflow: hidden; margin: 40px auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <!-- Header -->
        <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #1c1917, #0c0a09); border-bottom: 1px solid rgba(213, 180, 93, 0.2);">
                <span style="font-family: serif; font-size: 28px; font-weight: bold; color: #d5b45d; letter-spacing: 0.1em; text-transform: uppercase;">RoomRoll Chronicles</span>
                <div style="font-size: 12px; color: #cbc3b5; letter-spacing: 0.3em; text-transform: uppercase; margin-top: 5px;">Weekly Tavern Digest</div>
            </td>
        </tr>
        
        <!-- Content Body -->
        <tr>
            <td style="padding: 40px 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cbc3b5; margin-top: 0;">Hail, <strong>${recipientName}</strong>!</p>
                <p style="font-size: 14px; line-height: 1.6; color: #cbc3b5; margin-bottom: 30px;">Grab a mug of ale and pull up a chair. Here is your weekly dispatch of product updates, world event reports, and campaign action fresh from the Roomroll leylines!</p>
                
                <!-- Product Updates Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px; margin-top: 0;">🚀 What's New in the Tavern</h3>
                <p style="font-size: 13px; line-height: 1.6; color: #cbc3b5;">We've added three major features to enhance your campaigns this week:</p>
                <ul style="padding-left: 20px; margin-bottom: 30px;">
                    <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Dynamic Ambience & Mood System</strong>: DMs can now transition campaign lighting, backgrounds, and soundtrack playlists dynamically (choose between <em>tavern ambience</em>, <em>dungeon echoes</em>, and more!).</li>
                    <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Memory Moments System</strong>: Automatically track critical failures, legendary successes, betrayals, and character deaths into long-term emotional timelines.</li>
                    <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Secure Campaign URLs</strong>: All numeric sequential URL paths are now secure, non-enumerable hashed routes ('/rooms/cmp_xxxxxx').</li>
                </ul>
                
                <!-- Active Campaigns Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px;">🏰 Active Campaign Spotlights</h3>
                ${activeCampaignsHtml}
                
                <!-- World Events Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px; margin-top: 30px;">⛈️ World Events & Leyline Shifts</h3>
                <ul style="padding-left: 20px; margin-bottom: 30px;">
                    ${activeEventsHtml}
                </ul>
                
                <!-- Action Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; margin-bottom: 20px;">
                    <tr>
                        <td align="center">
                            <a href="https://roomroll.co.in" style="background-color: #d5b45d; color: #141210; padding: 14px 30px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 30px; letter-spacing: 0.1em; text-transform: uppercase; box-shadow: 0 4px 15px rgba(213, 180, 93, 0.3); display: inline-block;">Return to the Board</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td align="center" style="padding: 30px 20px; background-color: #0c0a09; border-top: 1px solid #2e261f; font-size: 11px; color: rgba(203, 195, 181, 0.5); line-height: 1.5;">
                <p style="margin: 0 0 10px 0; color: rgba(203, 195, 181, 0.6);">You are receiving this digest as a registered adventurer on Roomroll.</p>
                <p style="margin: 0;">&copy; 2026 Roomroll Inc. All rights reserved. &bull; <a href="#" style="color: #d5b45d; text-decoration: none;">Unsubscribe</a></p>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"Roomroll Chronicles" <${fromEmail}>`,
                    to: recipientEmail,
                    subject: 'Roomroll Chronicles: Weekly Tavern Digest 🍻',
                    html: emailHtml
                });
                sentCount++;
                logger.info(`Successfully sent weekly chronicle email to ${recipientEmail}`);
            } catch (err) {
                logger.error(`Failed to send email to ${recipientEmail}:`, { error: err });
            }
        } else {
            // Local fallback: write HTML files for verification
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeEmail = recipientEmail.replace(/[@.]/g, '_');
                const filePath = path.join(scratchEmailsDir, `${timestamp}_${safeEmail}.html`);
                
                fs.writeFileSync(filePath, emailHtml, 'utf8');
                loggedCount++;
                logger.info(`SMTP not configured. Logged weekly chronicle email to local file: scratch/sent_emails/${timestamp}_${safeEmail}.html`);
            } catch (fsErr) {
                logger.error('Failed to log fallback email to local file:', { error: fsErr });
            }
        }
    }

    logger.info(`Weekly email chronicles run complete. Sent: ${sentCount}, Logged (fallback): ${loggedCount}`);
    return { sentCount, loggedCount };
};

// Keep track of sent test emails in the current runtime session to prevent duplicates
const sentTestEmailsThisSession = new Set<string>();

export const sendTestChronicle = async (): Promise<{
    sentCount: number;
    failedCount: number;
    duplicateCount: number;
    details: Array<{ email: string; status: 'sent' | 'failed' | 'duplicate'; error?: string }>;
}> => {
    logger.info('Starting manual admin test chronicle delivery run...');

    // 1. Fetch all registered users
    const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, display_name, email');

    if (usersErr || !users || users.length === 0) {
        logger.warn('No registered users found or error fetching users for test email:', usersErr);
        throw usersErr || new Error('No registered users found in the realm.');
    }

    const details: Array<{ email: string; status: 'sent' | 'failed' | 'duplicate'; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    const scratchEmailsDir = path.join(__dirname, '../../scratch/sent_emails');
    if (!transporter) {
        fs.mkdirSync(scratchEmailsDir, { recursive: true });
    }

    for (const user of users) {
        const recipientName = user.display_name || 'Adventurer';
        const recipientEmail = user.email;

        // 2. Prevent duplicate sends during the same test session
        if (sentTestEmailsThisSession.has(recipientEmail)) {
            logger.info(`Skipping duplicate test chronicle email to ${recipientEmail} in this session`);
            duplicateCount++;
            details.push({ email: recipientEmail, status: 'duplicate' });
            continue;
        }

        // Build premium, styled fantasy newsletter
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Roomroll Chronicles: Test Transmission</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5efe2;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #141210; border: 1px solid #ab211f; border-radius: 20px; overflow: hidden; margin: 40px auto; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        <!-- Header -->
        <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #1c100e, #0c0a09); border-bottom: 2px solid #ab211f;">
                <span style="font-family: serif; font-size: 28px; font-weight: bold; color: #d5b45d; letter-spacing: 0.1em; text-transform: uppercase; text-shadow: 0 0 10px rgba(213, 180, 93, 0.3);">RoomRoll Chronicles</span>
                <div style="font-size: 11px; color: #cbc3b5; letter-spacing: 0.4em; text-transform: uppercase; margin-top: 5px;">🔮 Special Test Transmission 🔮</div>
            </td>
        </tr>
        
        <!-- Content Body -->
        <tr>
            <td style="padding: 40px 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #cbc3b5; margin-top: 0;">Hail, Brave <strong>${recipientName}</strong>!</p>
                <p style="font-size: 14px; line-height: 1.6; color: #cbc3b5; margin-bottom: 30px;">You are receiving this special parchment scroll as a verification of our realm's communication leylines. This test chronicle helps confirm that your links to the Tavern and the Game Board are active and secure.</p>
                
                <!-- Welcome Message Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px; margin-top: 0;">✨ Welcome to RoomRoll</h3>
                <p style="font-size: 13px; line-height: 1.6; color: #cbc3b5; margin-bottom: 30px;">RoomRoll is the ultimate virtual tabletop where your campaigns, profiles, and canvases are woven into a living, persistent saga. Whether you play as a Dungeon Master, a character traveler, or hand off control to our autonomous AI Storytellers, you are bound to a world that breathes and remembers.</p>
                
                <!-- Development Update Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px;">🚀 Active Development Chronicles</h3>
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(171, 33, 31, 0.2); border-radius: 12px; padding: 18px; margin-bottom: 30px;">
                    <ul style="padding-left: 15px; margin: 0; space-y: 8px;">
                        <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Dynamic Ambience & Mood System</strong>: DMs can now morph campaign backdrops, lighting, and ambient playlists on the fly matching combat or intrigue states.</li>
                        <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Secure Campaign Routing</strong>: Sequential database indices are now completely protected under mathematically obfuscated, unique 'cmp_xxxxxx' hash tokens.</li>
                        <li style="margin-bottom: 8px; color: #cbc3b5; font-size: 13px;"><strong>Memory Moments System</strong>: Significant narrative developments, including clutch natural d20 combat rolls and companion deaths, are cataloged persistently across sessions.</li>
                    </ul>
                </div>
                
                <!-- Teaser Section -->
                <h3 style="border-bottom: 1px solid rgba(213, 180, 93, 0.15); padding-bottom: 8px; color: #d5b45d; font-family: serif; font-size: 18px;">🕯️ Persistent Worlds & AI Storytelling</h3>
                <p style="font-size: 13px; line-height: 1.6; color: #cbc3b5; margin-bottom: 30px;">Our AI co-Storyteller does not just generate static text; it listens. It observes your characters' histories, remembers ancient betrayals, and seamlessly drops nostalgic references into active gameplay logs. Your choices leave permanent marks on the world, shaping canon and lore for sessions to come.</p>
                
                <!-- Action Button -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; margin-bottom: 20px;">
                    <tr>
                        <td align="center">
                            <a href="https://roomroll.co.in" style="background-color: #ab211f; color: #ffffff; padding: 14px 30px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 30px; letter-spacing: 0.1em; text-transform: uppercase; box-shadow: 0 4px 15px rgba(171, 33, 31, 0.4); display: inline-block; border: 1px solid rgba(213, 180, 93, 0.3);">Enter the Tavern Portal</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td align="center" style="padding: 30px 20px; background-color: #0c0a09; border-top: 1px solid #ab211f; font-size: 11px; color: rgba(203, 195, 181, 0.5); line-height: 1.5;">
                <p style="margin: 0 0 10px 0;">This is a developer-initiated communication test from RoomRoll.</p>
                <p style="margin: 0;">&copy; 2026 Roomroll Inc. All rights reserved. &bull; <a href="#" style="color: #d5b45d; text-decoration: none;">Sender Details</a></p>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: `"Roomroll Chronicles" <${fromEmail}>`,
                    to: recipientEmail,
                    subject: 'Roomroll Chronicles: Special Test Transmission 🔮',
                    html: emailHtml
                });
                sentCount++;
                sentTestEmailsThisSession.add(recipientEmail);
                details.push({ email: recipientEmail, status: 'sent' });
                logger.info(`Successfully sent test chronicle email to ${recipientEmail}`);
            } catch (err) {
                failedCount++;
                details.push({ email: recipientEmail, status: 'failed', error: String(err) });
                logger.error(`Failed to send test email to ${recipientEmail}:`, { error: err });
            }
        } else {
            // Local fallback
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeEmail = recipientEmail.replace(/[@.]/g, '_');
                const filePath = path.join(scratchEmailsDir, `TEST_${timestamp}_${safeEmail}.html`);
                
                fs.writeFileSync(filePath, emailHtml, 'utf8');
                sentCount++;
                sentTestEmailsThisSession.add(recipientEmail);
                details.push({ email: recipientEmail, status: 'sent' });
                logger.info(`SMTP not configured. Logged test chronicle email to local file: scratch/sent_emails/TEST_${timestamp}_${safeEmail}.html`);
            } catch (fsErr) {
                failedCount++;
                details.push({ email: recipientEmail, status: 'failed', error: String(fsErr) });
                logger.error('Failed to log fallback test email to local file:', { error: fsErr });
            }
        }
    }

    logger.info(`Manual admin test chronicle delivery complete. Sent: ${sentCount}, Failed: ${failedCount}, Duplicates: ${duplicateCount}`);
    return { sentCount, failedCount, duplicateCount, details };
};
