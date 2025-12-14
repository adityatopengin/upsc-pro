/**
 * DataManager.js
 * Handles all data operations: Saving results, loading stats, and syncing.
 * Implements "Local-First" architecture.
 */

class DataManager {
    constructor() {
        this.userId = null;
        this.mode = 'local'; // 'local' or 'cloud'
        this.initAuth();
    }

    /**
     * 1. Auth Initialization
     * Checks if user is logged in via Firebase
     */
    initAuth() {
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    this.userId = user.uid;
                    this.mode = 'cloud';
                    console.log(`DataManager: Switched to CLOUD mode (${this.userId})`);
                    this.syncLocalToCloud(); // Auto-sync on login
                } else {
                    this.userId = null;
                    this.mode = 'local';
                    console.log("DataManager: Switched to LOCAL mode");
                }
            });
        }
    }

    /**
     * 2. Save Quiz Result
     * @param {Object} resultData - { score, total, subject, timestamp, mistakes: [] }
     */
    async saveResult(resultData) {
        // Always save to local history first (for offline access/speed)
        const history = this.getLocalHistory();
        history.push(resultData);
        localStorage.setItem('upsc_history', JSON.stringify(history));

        // If logged in, also push to Firebase
        if (this.mode === 'cloud') {
            try {
                await db.collection('users').doc(this.userId).collection('attempts').add({
                    ...resultData,
                    syncedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update aggregate stats atomically
                const statsRef = db.collection('users').doc(this.userId).collection('stats').doc('aggregate');
                await statsRef.set({
                    totalQuestions: firebase.firestore.FieldValue.increment(resultData.total),
                    totalCorrect: firebase.firestore.FieldValue.increment(resultData.score),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log("Result saved to Cloud");
            } catch (error) {
                console.error("Cloud save failed:", error);
            }
        }
        
        return true;
    }

    /**
     * 3. Fetch Questions
     * Loads JSON files from the /data directory
     */
    async fetchQuestions(filename) {
        try {
            const response = await fetch(`./data/${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to load question bank:", error);
            return [];
        }
    }

    /**
     * 4. Get Statistics (For Dashboard)
     */
    async getStats() {
        if (this.mode === 'cloud') {
            // Future: Fetch from Firestore if needed
        }
        
        // Calculate from Local Storage
        const history = this.getLocalHistory();
        if (history.length === 0) return this.getEmptyStats();

        let totalQs = 0;
        let correct = 0;
        let time = 0;

        history.forEach(h => {
            totalQs += (h.total || 0);
            correct += (h.score || 0);
            time += (h.timeSpent || 0);
        });

        return {
            totalQuestions: totalQs,
            accuracy: totalQs > 0 ? Math.round((correct/totalQs)*100) : 0,
            studyHours: Math.round(time / 60), // assuming time is in minutes
            historyCount: history.length
        };
    }

    /**
     * Helper: Read Local Storage
     */
    getLocalHistory() {
        return JSON.parse(localStorage.getItem('upsc_history') || '[]');
    }

    getEmptyStats() {
        return { totalQuestions: 0, accuracy: 0, studyHours: 0, historyCount: 0 };
    }

    /**
     * 5. Sync Logic
     * Uploads local data to cloud when user logs in
     */
    syncLocalToCloud() {
        const history = this.getLocalHistory();
        const unsynced = history.filter(h => !h.synced);
        
        if (unsynced.length > 0) {
            console.log(`Syncing ${unsynced.length} records to cloud...`);
            // Logic to batch upload would go here
            // Mark items as synced in localStorage after success
        }
    }
}

// Export a single instance
const appData = new DataManager();
