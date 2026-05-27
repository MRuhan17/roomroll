import request from 'supertest';

jest.mock('../src/config/db', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        sign: jest.fn(),
        verify: jest.fn(() => ({ id: 42, email: 'dm@example.com' })),
    },
}));

import jwt from 'jsonwebtoken';
import app from '../src/app';
import { supabase } from '../src/config/db';
import { createQueryBuilder } from './helpers/supabaseMock';

describe('character routes', () => {
    const supabaseFromMock = supabase.from as jest.Mock;
    const jwtMock = jwt as jest.Mocked<typeof jwt>;
    const authHeader = { Authorization: 'Bearer valid-token' };

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
        jwtMock.verify.mockReturnValue({ id: 42, email: 'dm@example.com' } as never);
        supabaseFromMock.mockReset();
    });

    it('creates a character for a campaign member', async () => {
        // Table-based dynamic mock router
        supabaseFromMock.mockImplementation((table: string) => {
            if (table === 'campaigns') {
                return createQueryBuilder({ data: { id: 7, name: 'Test Campaign' }, error: null }, 'maybeSingle');
            }
            if (table === 'campaign_members') {
                return createQueryBuilder({
                    data: { id: 1, campaign_id: 7, user_id: 42, role: 'DM', joined_at: '2026-05-11T00:00:00.000Z' },
                    error: null,
                }, 'maybeSingle');
            }
            if (table === 'characters') {
                return createQueryBuilder({
                    data: {
                        id: 101,
                        campaign_id: 7,
                        user_id: 42,
                        name: 'Aelar',
                        class_name: 'Ranger',
                        species: 'Elf',
                        background: null,
                        backstory: null,
                        is_npc: false,
                        level: 1,
                        xp: 0,
                        ability_scores: {
                            strength: 10,
                            dexterity: 16,
                            constitution: 12,
                            intelligence: 10,
                            wisdom: 14,
                            charisma: 10,
                        },
                        combat_stats: {
                            hp_current: 12,
                            hp_max: 12,
                            armor_class: 15,
                            speed: 30,
                            proficiency_bonus: 2,
                        },
                        progression_state: { milestones: [], talents: [], notes: [] },
                        currency: { gold: 12 },
                        notes: null,
                        created_at: '2026-05-11T00:00:00.000Z',
                        updated_at: '2026-05-11T00:00:00.000Z',
                    },
                    error: null,
                }, 'maybeSingle');
            }
            if (table === 'campaign_events') {
                return createQueryBuilder({ data: { id: 900 }, error: null }, 'single');
            }
            if (table === 'inventory_items') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_equipment') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_status_effects') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_progression_log') {
                return createQueryBuilder({ data: [], error: null }, 'limit');
            }
            throw new Error(`Unexpected table query: ${table}`);
        });

        const response = await request(app)
            .post('/api/campaigns/7/characters')
            .set(authHeader)
            .send({
                name: 'Aelar',
                className: 'Ranger',
                species: 'Elf',
                abilityScores: {
                    dexterity: 16,
                    constitution: 12,
                    wisdom: 14,
                },
                combatStats: {
                    hp_current: 12,
                    hp_max: 12,
                    armor_class: 15,
                },
                currency: {
                    gold: 12,
                },
            });

        console.log('CREATE RESPONSE:', response.body);
        expect(response.status).toBe(201);
        expect(response.body.character).toMatchObject({
            id: 101,
            name: 'Aelar',
            user_id: 42,
            level: 1,
            xp: 0,
            progression_summary: {
                level: 1,
                xp: 0,
                xp_for_current_level: 0,
                xp_for_next_level: 1000,
                xp_into_level: 0,
            },
            inventory: [],
            equipment: [],
            status_effects: [],
            progression_log: [],
        });
    });

    it('lists characters for a campaign member', async () => {
        supabaseFromMock.mockImplementation((table: string) => {
            if (table === 'campaigns') {
                return createQueryBuilder({ data: { id: 7, name: 'Test Campaign' }, error: null }, 'maybeSingle');
            }
            if (table === 'campaign_members') {
                return createQueryBuilder({
                    data: { id: 2, campaign_id: 7, user_id: 42, role: 'player', joined_at: '2026-05-11T00:00:00.000Z' },
                    error: null,
                }, 'maybeSingle');
            }
            if (table === 'characters') {
                return createQueryBuilder({
                    data: [
                        {
                            id: 101,
                            campaign_id: 7,
                            user_id: 42,
                            name: 'Aelar',
                            class_name: 'Ranger',
                            species: 'Elf',
                            background: null,
                            backstory: null,
                            is_npc: false,
                            level: 2,
                            xp: 1200,
                            ability_scores: {
                                strength: 10,
                                dexterity: 16,
                                constitution: 12,
                                intelligence: 10,
                                wisdom: 14,
                                charisma: 10,
                            },
                            combat_stats: {
                                hp_current: 18,
                                hp_max: 18,
                                armor_class: 15,
                                speed: 30,
                                proficiency_bonus: 2,
                            },
                            progression_state: { milestones: ['First Hunt'], talents: [], notes: [] },
                            currency: {},
                            notes: null,
                            created_at: '2026-05-11T00:00:00.000Z',
                            updated_at: '2026-05-11T00:00:00.000Z',
                        },
                    ],
                    error: null,
                }, 'order');
            }
            if (table === 'inventory_items') {
                return createQueryBuilder({
                    data: [
                        {
                            id: 501,
                            campaign_id: 7,
                            character_id: 101,
                            name: 'Longbow',
                            description: null,
                            item_type: 'weapon',
                            rarity: null,
                            quantity: 1,
                            weight: 2,
                            stackable: false,
                            equippable: true,
                            item_data: { damage: '1d8' },
                            created_at: '2026-05-11T00:00:00.000Z',
                            updated_at: '2026-05-11T00:00:00.000Z',
                        },
                    ],
                    error: null,
                }, 'order');
            }
            if (table === 'character_equipment') {
                return createQueryBuilder({
                    data: [
                        {
                            id: 601,
                            campaign_id: 7,
                            character_id: 101,
                            inventory_item_id: 501,
                            slot: 'weapon',
                            equipped_at: '2026-05-11T00:00:00.000Z',
                        },
                    ],
                    error: null,
                }, 'order');
            }
            if (table === 'character_status_effects') {
                return createQueryBuilder({
                    data: [
                        {
                            id: 701,
                            campaign_id: 7,
                            character_id: 101,
                            name: 'Blessed',
                            effect_type: 'buff',
                            source: 'Cleric',
                            duration_type: 'rounds',
                            duration_value: 10,
                            remaining_duration: 7,
                            modifiers: { attack: 1 },
                            is_active: true,
                            applied_at: '2026-05-11T00:00:00.000Z',
                            expires_at: null,
                            removed_at: null,
                        },
                    ],
                    error: null,
                }, 'order');
            }
            if (table === 'character_progression_log') {
                return createQueryBuilder({ data: [], error: null }, 'limit');
            }
            throw new Error(`Unexpected table query: ${table}`);
        });

        const response = await request(app)
            .get('/api/campaigns/7/characters')
            .set(authHeader);

        expect(response.status).toBe(200);
        expect(response.body.characters).toHaveLength(1);
        expect(response.body.characters[0]).toMatchObject({
            id: 101,
            progression_summary: {
                level: 2,
                xp: 1200,
                xp_for_current_level: 1000,
                xp_for_next_level: 2000,
                xp_into_level: 200,
            },
        });
        expect(response.body.characters[0].equipment[0]).toMatchObject({
            slot: 'weapon',
            item: {
                id: 501,
                name: 'Longbow',
            },
        });
        expect(response.body.characters[0].status_effects[0]).toMatchObject({
            id: 701,
            name: 'Blessed',
        });
    });

    it('awards XP and levels up a character', async () => {
        let characterCalls = 0;

        supabaseFromMock.mockImplementation((table: string) => {
            if (table === 'campaigns') {
                return createQueryBuilder({ data: { id: 7, name: 'Test Campaign' }, error: null }, 'maybeSingle');
            }
            if (table === 'campaign_members') {
                return createQueryBuilder({
                    data: { id: 1, campaign_id: 7, user_id: 42, role: 'DM', joined_at: '2026-05-11T00:00:00.000Z' },
                    error: null,
                }, 'maybeSingle');
            }
            if (table === 'characters') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    update: jest.fn().mockReturnThis(),
                    maybeSingle: jest.fn().mockImplementation(() => {
                        characterCalls += 1;
                        if (characterCalls === 1) {
                            return Promise.resolve({
                                data: {
                                    id: 101,
                                    campaign_id: 7,
                                    user_id: 55,
                                    name: 'Aelar',
                                    class_name: 'Ranger',
                                    species: 'Elf',
                                    background: null,
                                    backstory: null,
                                    is_npc: false,
                                    level: 1,
                                    xp: 900,
                                    ability_scores: {
                                        strength: 10,
                                        dexterity: 16,
                                        constitution: 12,
                                        intelligence: 10,
                                        wisdom: 14,
                                        charisma: 10,
                                    },
                                    combat_stats: {
                                        hp_current: 12,
                                        hp_max: 12,
                                        armor_class: 15,
                                        speed: 30,
                                        proficiency_bonus: 2,
                                    },
                                    progression_state: { milestones: [], talents: [], notes: [] },
                                    currency: {},
                                    notes: null,
                                    created_at: '2026-05-11T00:00:00.000Z',
                                    updated_at: '2026-05-11T00:00:00.000Z',
                                },
                                error: null,
                            });
                        } else {
                            return Promise.resolve({
                                data: {
                                    id: 101,
                                    campaign_id: 7,
                                    user_id: 55,
                                    name: 'Aelar',
                                    class_name: 'Ranger',
                                    species: 'Elf',
                                    background: null,
                                    backstory: null,
                                    is_npc: false,
                                    level: 2,
                                    xp: 1150,
                                    ability_scores: {
                                        strength: 10,
                                        dexterity: 16,
                                        constitution: 12,
                                        intelligence: 10,
                                        wisdom: 14,
                                        charisma: 10,
                                    },
                                    combat_stats: {
                                        hp_current: 18,
                                        hp_max: 18,
                                        armor_class: 15,
                                        speed: 30,
                                        proficiency_bonus: 2,
                                    },
                                    progression_state: { milestones: [], talents: [], notes: [] },
                                    currency: {},
                                    notes: null,
                                    created_at: '2026-05-11T00:00:00.000Z',
                                    updated_at: '2026-05-11T00:00:00.000Z',
                                },
                                error: null,
                            });
                        }
                    })
                };
            }
            if (table === 'campaign_events') {
                return createQueryBuilder({ data: { id: 901 }, error: null }, 'single');
            }
            if (table === 'inventory_items') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_equipment') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_status_effects') {
                return createQueryBuilder({ data: [], error: null }, 'order');
            }
            if (table === 'character_progression_log') {
                return {
                    insert: jest.fn().mockResolvedValue({ error: null }),
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue({
                        data: [
                            {
                                id: 801,
                                campaign_id: 7,
                                character_id: 101,
                                change_type: 'level_up',
                                amount: 1,
                                previous_xp: 900,
                                new_xp: 1150,
                                previous_level: 1,
                                new_level: 2,
                                reason: 'Quest completion',
                                metadata: { source: 'quest' },
                                created_by: 42,
                                created_at: '2026-05-11T00:01:00.000Z',
                            },
                        ],
                        error: null,
                    })
                };
            }
            throw new Error(`Unexpected table query: ${table}`);
        });

        const response = await request(app)
            .post('/api/campaigns/7/characters/101/xp')
            .set(authHeader)
            .send({
                amount: 250,
                reason: 'Quest completion',
                metadata: { source: 'quest' },
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            previous_level: 1,
            previous_xp: 900,
            leveled_up: true,
            levels_gained: 1,
            character: {
                id: 101,
                level: 2,
                xp: 1150,
                progression_summary: {
                    level: 2,
                    xp: 1150,
                    xp_for_current_level: 1000,
                    xp_for_next_level: 2000,
                    xp_into_level: 150,
                },
            },
        });
    });
});
