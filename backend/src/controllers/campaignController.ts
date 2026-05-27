import { Request, Response } from 'express';
import { createCampaign, getCampaignById, getCampaignByInviteCode, getMember, getUserActiveCampaign, joinCampaign, listMembers } from '../services/campaignService';
import { getCampaignSnapshot } from '../services/campaignStateService';

export const createCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { name, description, worldType, playMode, genre, tone, storyFootnotes, guidance, targetSessions, pacingIntensity, criticalArcs } = req.body as {
        name?: string;
        description?: string;
        worldType?: string;
        playMode?: 'human_dm' | 'player_only' | 'ai_dm';
        genre?: string;
        tone?: string;
        storyFootnotes?: string;
        guidance?: {
            important_locations?: string;
            forbidden_lore?: string;
            campaign_objectives?: string;
            recurring_villains?: string;
            faction_conflicts?: string;
            emotional_themes?: string;
        };
        targetSessions?: number;
        pacingIntensity?: 'auto' | 'slow' | 'balanced' | 'fast';
        criticalArcs?: string[];
    };
    if (!name) {
        return res.status(400).json({ message: 'Campaign name is required' });
    }
    try {
        const campaign = await createCampaign({
            name,
            description,
            worldType,
            dmUserId: user.id,
            playMode,
            genre,
            tone,
            storyFootnotes,
            guidance,
            targetSessions,
            pacingIntensity,
            criticalArcs
        });
        return res.status(201).json({ campaign });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create campaign' });
    }
};

export const joinCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { inviteCode } = req.body as { inviteCode?: string };
    if (!inviteCode) {
        return res.status(400).json({ message: 'Invite code required' });
    }
    const campaign = await getCampaignByInviteCode(inviteCode);
    if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }
    try {
        const membership = await joinCampaign(campaign.id, user.id);
        return res.json({ campaign, membership });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to join campaign' });
    }
};

export const getActiveCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaign = await getUserActiveCampaign(user.id);
    if (!campaign) {
        return res.status(404).json({ message: 'No active campaign found' });
    }
    return res.json({ campaign });
};

export const getUserCampaignsHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const { getUserCampaigns, listMembers } = await import('../services/campaignService');
        const { getCampaignSnapshot } = await import('../services/campaignStateService');
        const { supabase } = await import('../config/db');

        const campaigns = await getUserCampaigns(user.id);

        const enrichedCampaigns = await Promise.all(campaigns.map(async (camp) => {
            try {
                const members = await listMembers(camp.id);
                const snapshot = await getCampaignSnapshot(camp.id);
                const hostMember = members.find(m => m.role === 'DM');

                let hostName = 'Dungeon Master';
                if (hostMember) {
                    const { data: hostUser } = await supabase
                        .from('users')
                        .select('display_name')
                        .eq('id', hostMember.user_id)
                        .maybeSingle();
                    if (hostUser) {
                        hostName = hostUser.display_name;
                    }
                }

                return {
                    ...camp,
                    playerCount: members.length,
                    hostName,
                    lastActivity: snapshot.recentEvents?.[0]?.created_at || camp.created_at,
                    activeSessionState: camp.current_session_state
                };
            } catch (err) {
                console.error(`Failed to enrich campaign ${camp.id}:`, err);
                return {
                    ...camp,
                    playerCount: 1,
                    hostName: 'Dungeon Master',
                    lastActivity: camp.created_at,
                    activeSessionState: camp.current_session_state
                };
            }
        }));

        return res.json({ campaigns: enrichedCampaigns });
    } catch (error) {
        console.error('Failed to get user campaigns:', error);
        return res.status(500).json({ message: 'Failed to retrieve campaigns' });
    }
};

export const getCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }
    const members = await listMembers(campaignId);
    return res.json({ campaign, members });
};

export const getCampaignSnapshotHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    const snapshot = await getCampaignSnapshot(campaignId);
    return res.json({ snapshot });
};

export const updateCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    const { description, worldType } = req.body as { description?: string, worldType?: string };
    
    // Quick update via supabase client directly since campaignService doesn't have it
    const { supabase } = await import('../config/db');
    const { data, error } = await supabase
        .from('campaigns')
        .update({ description, world_type: worldType })
        .eq('id', campaignId)
        .select('*')
        .single();
        
    if (error) {
        return res.status(500).json({ message: 'Failed to update campaign' });
    }
    return res.json({ campaign: data });
};

export const getStoryPrepHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'Only the Dungeon Master can access story preparation tools.' });
    }

    const { supabase } = await import('../config/db');
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }

    const state = campaign.current_session_state as any || {};
    let storyPoints = state.future_story_points || [];

    // Auto-generate if none exist
    if (storyPoints.length === 0) {
        try {
            const { generateFutureStoryPreparation } = await import('../ai/aiService');
            storyPoints = await generateFutureStoryPreparation(campaignId, user.id);
            state.future_story_points = storyPoints;
            await supabase
                .from('campaigns')
                .update({ current_session_state: state })
                .eq('id', campaignId);
        } catch (err) {
            console.error('Failed to auto-generate story prep:', err);
            return res.status(500).json({ message: 'Failed to generate initial story preparation' });
        }
    }

    return res.json({ storyPoints });
};

export const generateStoryPrepHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'Only the Dungeon Master can access story preparation tools.' });
    }

    const { supabase } = await import('../config/db');
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }

    const state = campaign.current_session_state as any || {};
    const existingPoints = state.future_story_points || [];

    try {
        const { generateFutureStoryPreparation } = await import('../ai/aiService');
        const newPoints = await generateFutureStoryPreparation(campaignId, user.id);
        
        // Merge strategy: Keep locked points, replace unlocked points!
        const mergedPoints = existingPoints.map((p: any) => p.is_locked ? p : null);
        
        // Fill slots with new points
        let newIdx = 0;
        for (let i = 0; i < 10; i++) {
            if (!mergedPoints[i]) {
                while (newIdx < newPoints.length && newPoints[newIdx].is_locked) {
                    newIdx++;
                }
                if (newIdx < newPoints.length) {
                    mergedPoints[i] = { ...newPoints[newIdx], id: i + 1 };
                    newIdx++;
                } else {
                    mergedPoints[i] = {
                        id: i + 1,
                        title: `Chapter ${i + 1}: The Emerging Path`,
                        description: `A new threat reveals itself as the journey continues.`,
                        branch_type: 'main',
                        is_locked: false,
                        is_rejected: false
                    };
                }
            }
        }

        state.future_story_points = mergedPoints;
        
        const { error: updateError } = await supabase
            .from('campaigns')
            .update({ current_session_state: state })
            .eq('id', campaignId);

        if (updateError) {
            return res.status(500).json({ message: 'Failed to save regenerated story preparation' });
        }

        return res.json({ storyPoints: mergedPoints });
    } catch (err) {
        console.error('Failed to regenerate story prep:', err);
        return res.status(500).json({ message: 'Failed to regenerate story preparation' });
    }
};

export const updateStoryPointHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const pointId = Number(req.params.pointId);
    if (!campaignId || !pointId) {
        return res.status(400).json({ message: 'Campaign ID and Point ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'Only the Dungeon Master can access story preparation tools.' });
    }

    const { supabase } = await import('../config/db');
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }

    const state = campaign.current_session_state as any || {};
    let storyPoints = state.future_story_points || [];

    const pointIdx = storyPoints.findIndex((p: any) => p.id === pointId);
    if (pointIdx === -1) {
        return res.status(404).json({ message: 'Story point not found' });
    }

    // Merge modifications from body
    storyPoints[pointIdx] = {
        ...storyPoints[pointIdx],
        ...req.body
    };

    state.future_story_points = storyPoints;

    const { error: updateError } = await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);

    if (updateError) {
        return res.status(500).json({ message: 'Failed to update story point' });
    }

    return res.json({ storyPoint: storyPoints[pointIdx] });
};

export const addCustomStoryPointHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'Only the Dungeon Master can access story preparation tools.' });
    }

    const { supabase } = await import('../config/db');
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }

    const state = campaign.current_session_state as any || {};
    let storyPoints = state.future_story_points || [];

    // Generate new unique ID
    const maxId = storyPoints.reduce((max: number, p: any) => Math.max(max, p.id || 0), 0);
    const newPoint = {
        id: maxId + 1,
        title: req.body.title || 'Untitled Custom Point',
        description: req.body.description || 'A custom narrative event designed by the DM.',
        branch_type: req.body.branch_type || 'main',
        pacing_recommendation: req.body.pacing_recommendation || '',
        emotional_moment: req.body.emotional_moment || '',
        combat_opportunity: req.body.combat_opportunity || '',
        player_decision_prediction: req.body.player_decision_prediction || '',
        backup_scenario: req.body.backup_scenario || '',
        possible_encounters: req.body.possible_encounters || '',
        faction_reactions: req.body.faction_reactions || '',
        character_consequences: req.body.character_consequences || '',
        plot_twists: req.body.plot_twists || '',
        npc_betrayals: req.body.npc_betrayals || '',
        lore_discoveries: req.body.lore_discoveries || '',
        is_locked: true,
        is_rejected: false
    };

    storyPoints.push(newPoint);
    state.future_story_points = storyPoints;

    const { error: updateError } = await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);

    if (updateError) {
        return res.status(500).json({ message: 'Failed to add custom story point' });
    }

    return res.status(201).json({ storyPoint: newPoint });
};

export const getSessionRecapsHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const { supabase } = await import('../config/db');
    const { data: logs, error } = await supabase
        .from('session_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ message: 'Failed to retrieve session logs' });
    }

    // Format logs into cinematic recaps
    const recaps = logs.map((log: any) => {
        let recap = null;
        if (log.session_summary) {
            try {
                if (log.session_summary.trim().startsWith('{')) {
                    recap = JSON.parse(log.session_summary);
                }
            } catch (err) {
                console.warn('Failed to parse session_summary as JSON for recap', log.id, err);
            }
        }

        // Fallback for older plain text summaries
        if (!recap) {
            recap = {
                title: `Chapter: ${new Date(log.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`,
                summary: log.session_summary || "The party continued their adventure in the realm.",
                tone: 'dramatic',
                highlights: [
                    {
                        type: 'discovery',
                        description: log.session_summary ? 'The adventure unfolded with legendary weight.' : 'A quiet chapter in the annals of history.',
                        intensity: 'medium'
                    }
                ],
                narration: log.session_summary || "The party continued their adventure."
            };
        }

        return {
            id: log.id,
            sessionId: log.session_id,
            roomId: log.room_id,
            createdAt: log.created_at,
            ...recap
        };
    });

    return res.json({ recaps });
};

export const generateSessionRecapHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const sessionId = req.params.sessionId as string;
    if (!campaignId || !sessionId) {
        return res.status(400).json({ message: 'Campaign ID and Session ID are required.' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member.' });
    }

    const { tone } = req.body as { tone?: string };

    try {
        const { generateCinematicRecap } = await import('../ai/aiService');
        const recap = await generateCinematicRecap(campaignId, sessionId, tone || 'dramatic', user.id);
        return res.json({ recap });
    } catch (error: any) {
        console.error('Failed to generate cinematic recap:', error);
        return res.status(500).json({ message: error.message || 'Failed to generate session recap' });
    }
};

export const updateCampaignPacingHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    const { targetSessions, completedSessions, pacingIntensity, criticalArcs } = req.body as {
        targetSessions?: number;
        completedSessions?: number;
        pacingIntensity?: 'auto' | 'slow' | 'balanced' | 'fast';
        criticalArcs?: string[];
    };

    const { supabase } = await import('../config/db');
    
    // Fetch existing state
    const { data: campaignData, error: fetchError } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();
        
    if (fetchError || !campaignData) {
        return res.status(404).json({ message: 'Campaign not found' });
    }

    const state = campaignData.current_session_state as any || {};
    
    // Update pacing params
    if (targetSessions !== undefined) state.target_sessions = targetSessions;
    if (completedSessions !== undefined) state.completed_sessions = completedSessions;
    if (pacingIntensity !== undefined) state.pacing_intensity = pacingIntensity;
    if (criticalArcs !== undefined) state.critical_arcs = criticalArcs;

    const { data, error } = await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId)
        .select('*')
        .single();
        
    if (error) {
        return res.status(500).json({ message: 'Failed to update campaign pacing configuration' });
    }
    return res.json({ campaign: data });
};

export const getTavernHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    try {
        const { getOrGenerateTavern } = await import('../services/tavernService');
        const tavern = await getOrGenerateTavern(campaignId);
        return res.json({ tavern });
    } catch (error: any) {
        console.error('Failed to get tavern:', error);
        return res.status(500).json({ message: error.message || 'Failed to retrieve tavern state' });
    }
};

export const generateTavernHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    try {
        const { generateProceduralTavern } = await import('../services/tavernService');
        const { supabase } = await import('../config/db');
        
        const newTavern = await generateProceduralTavern(campaignId);
        
        const { data: campaignData } = await supabase
            .from('campaigns')
            .select('current_session_state')
            .eq('id', campaignId)
            .single();
            
        const state = campaignData?.current_session_state as any || {};
        state.tavern = newTavern;
        
        await supabase
            .from('campaigns')
            .update({ current_session_state: state })
            .eq('id', campaignId);
            
        return res.json({ tavern: newTavern });
    } catch (error: any) {
        console.error('Failed to generate tavern:', error);
        return res.status(500).json({ message: error.message || 'Failed to generate tavern' });
    }
};

export const chatWithNpcHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const npcId = req.params.npcId as string;
    const { message } = req.body as { message?: string };
    
    if (!campaignId || !npcId || !message) {
        return res.status(400).json({ message: 'Campaign ID, NPC ID, and message are required' });
    }
    try {
        const { chatWithNpc } = await import('../services/tavernService');
        const result = await chatWithNpc(campaignId, npcId, message, user.id);
        return res.json(result);
    } catch (error: any) {
        console.error('Failed to chat with NPC:', error);
        return res.status(500).json({ message: error.message || 'Failed to communicate with NPC' });
    }
};

export const respondToFactionRecruitmentHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const encounterId = req.params.encounterId as string;
    const { action } = req.body as { action?: 'accept' | 'decline' };
    
    if (!campaignId || !encounterId || !action) {
        return res.status(400).json({ message: 'Campaign ID, encounter ID, and action are required' });
    }
    try {
        const { respondToFactionRecruitment } = await import('../services/tavernService');
        const tavern = await respondToFactionRecruitment(campaignId, encounterId, action);
        return res.json({ tavern });
    } catch (error: any) {
        console.error('Failed to respond to faction encounter:', error);
        return res.status(500).json({ message: error.message || 'Failed to record faction response' });
    }
};

export const triggerTavernEventHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    try {
        const { triggerTavernEvent } = await import('../services/tavernService');
        const result = await triggerTavernEvent(campaignId);
        return res.json(result);
    } catch (error: any) {
        console.error('Failed to trigger event:', error);
        return res.status(500).json({ message: error.message || 'Failed to trigger tavern event' });
    }
};

export const updateCampaignAmbienceHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    const { mood, ambience } = req.body as { mood?: string; ambience?: string };
    
    try {
        const { supabase } = await import('../config/db');
        const { data: campaign, error: fetchErr } = await supabase
            .from('campaigns')
            .select('current_session_state')
            .eq('id', campaignId)
            .single();
            
        if (fetchErr || !campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        
        const state = campaign.current_session_state as any || {};
        if (mood !== undefined) state.mood = mood;
        if (ambience !== undefined) state.ambience = ambience;
        
        const { data: updatedCampaign, error: updateErr } = await supabase
            .from('campaigns')
            .update({ current_session_state: state })
            .eq('id', campaignId)
            .select('*')
            .single();
            
        if (updateErr) {
            return res.status(500).json({ message: 'Failed to update campaign ambience' });
        }
        
        // Broadcast the updated campaign state to sync the new mood/ambience
        try {
            const { getCampaignSnapshot } = await import('../services/campaignStateService');
            const { getIo } = await import('../socket');
            const { SocketEvents } = await import('../types/socket');
            
            const snapshot = await getCampaignSnapshot(campaignId);
            const io = getIo();
            io.to(`campaign:${campaignId}`).emit(SocketEvents.CampaignState, {
                snapshot
            });
        } catch (snapErr) {
            console.error('Failed to broadcast campaign state update after manual transition:', snapErr);
        }
        
        return res.json({ campaign: updatedCampaign });
    } catch (err: any) {
        console.error('Failed to transition campaign ambience:', err);
        return res.status(500).json({ message: 'Failed to update campaign ambience' });
    }
};

