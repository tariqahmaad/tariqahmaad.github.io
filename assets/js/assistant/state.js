/**
 * Factories for the assistant's per-conversation state. The constructor and
 * "restart chat" both use these, so the initial state is defined in one place.
 */

export function createConversationMemory() {
    return {
        currentTopic: null,
        mentionedEntities: new Set(),
        userPreferences: {},
        questionHistory: []
    };
}

export function createPersonality() {
    return {
        traits: {
            enthusiastic: 0.8,
            professional: 0.9,
            humor: 0.6,
            empathy: 0.7,
            techSavvy: 0.9
        },
        currentMood: 'professional',
        userInteractionStyle: 'neutral',
        conversationDepth: 0,
        engagementLevel: 0
    };
}

export function createUserProfile() {
    return {
        visitCount: 0,
        interests: new Set(),
        technicalLevel: 0.5,
        communicationStyle: 'professional',
        lastVisit: null,
        totalInteractions: 0
    };
}
