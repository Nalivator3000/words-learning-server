// Friends UI - Social features for connecting with other learners
// Only accessible to whitelisted users (feature level 5)

class FriendsUI {
    constructor() {
        this.userId = null;
        this.friends = [];
        this.receivedRequests = [];
        this.sentRequests = [];
        this.activities = [];
        this.searchResults = [];
        this.currentTab = 'friends'; // 'friends', 'requests', 'search', 'activity'
        this.initialized = false;
    }

    async init(userId) {
        if (!userManager.hasGamificationAccess()) {
            console.log('Friends: Access denied');
            this.hideSection();
            return;
        }

        this.userId = userId;
        console.log('Friends UI: Initializing for user', userId);

        try {
            await this.loadData();
            this.render();
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Friends UI:', error);
            this.showError(error.message);
        }
    }

    hideSection() {
        const section = document.getElementById('friendsSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    async loadData() {
        try {
            // Load friends list, requests, and activities in parallel
            const [friendsRes, receivedReqRes, sentReqRes, activitiesRes] = await Promise.all([
                fetch(`/api/friends/${this.userId}`),
                fetch(`/api/friends/requests/received/${this.userId}`),
                fetch(`/api/friends/requests/sent/${this.userId}`),
                fetch(`/api/friends/activities/${this.userId}`)
            ]);

            if (!friendsRes.ok || !receivedReqRes.ok || !sentReqRes.ok || !activitiesRes.ok) {
                throw new Error('Failed to load friends data');
            }

            this.friends = await friendsRes.json();
            this.receivedRequests = await receivedReqRes.json();
            this.sentRequests = await sentReqRes.json();
            this.activities = await activitiesRes.json();

            console.log('Friends data loaded:', {
                friends: this.friends.length,
                receivedRequests: this.receivedRequests.length,
                sentRequests: this.sentRequests.length,
                activities: this.activities.length
            });
        } catch (error) {
            console.error('Error loading friends data:', error);
            throw error;
        }
    }

    render() {
        const container = document.getElementById('friendsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="friends-header">
                <h2 data-i18n="friends_title">Friends</h2>
                <div class="friends-tabs">
                    <button class="tab-btn ${this.currentTab === 'friends' ? 'active' : ''}" data-tab="friends">
                        <span data-i18n="my_friends">My Friends</span>
                        <span class="tab-count">${this.friends.length}</span>
                    </button>
                    <button class="tab-btn ${this.currentTab === 'requests' ? 'active' : ''}" data-tab="requests">
                        <span data-i18n="friend_requests">Requests</span>
                        ${this.receivedRequests.length > 0 ? `<span class="tab-badge">${this.receivedRequests.length}</span>` : ''}
                    </button>
                    <button class="tab-btn ${this.currentTab === 'search' ? 'active' : ''}" data-tab="search">
                        <span data-i18n="find_friends">Find Friends</span>
                    </button>
                    <button class="tab-btn ${this.currentTab === 'activity' ? 'active' : ''}" data-tab="activity">
                        <span data-i18n="activity_feed">Activity</span>
                    </button>
                </div>
            </div>

            <div class="friends-content-area">
                ${this.renderTabContent()}
            </div>
        `;

        // Add event listeners for tabs
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Add event listeners for action buttons
        this.attachActionListeners(container);

        // Update i18n
        if (window.i18n) {
            i18n.updatePageTranslations();
        }
    }

    renderTabContent() {
        switch (this.currentTab) {
            case 'friends':
                return this.renderFriendsList();
            case 'requests':
                return this.renderRequestsTab();
            case 'search':
                return this.renderSearchTab();
            case 'activity':
                return this.renderActivityFeed();
            default:
                return '';
        }
    }

    renderFriendsList() {
        if (this.friends.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3 data-i18n="no_friends_yet">No friends yet</h3>
                    <p data-i18n="find_friends_hint">Search for users to add your first friend!</p>
                    <button class="action-btn switch-tab-btn" data-tab="search">
                        <span data-i18n="find_friends">Find Friends</span>
                    </button>
                </div>
            `;
        }

        return `
            <div class="friends-list">
                ${this.friends.map(friend => this.renderFriendCard(friend)).join('')}
            </div>
        `;
    }

    renderFriendCard(friend) {
        return `
            <div class="friend-card">
                <div class="friend-avatar">
                    ${friend.avatar_url
                        ? `<img src="${friend.avatar_url}" alt="${friend.username}">`
                        : `<div class="avatar-placeholder">${friend.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="friend-info">
                    <h4 class="friend-username">${friend.username}</h4>
                    <p class="friend-stats">
                        <span>Level ${friend.level || 1}</span>
                        <span>•</span>
                        <span>${friend.total_xp || 0} XP</span>
                    </p>
                    ${friend.current_streak > 0 ? `<p class="friend-streak">🔥 ${friend.current_streak} day streak</p>` : ''}
                </div>
                <div class="friend-actions">
                    <button class="action-btn-small view-profile-btn" data-user-id="${friend.friend_id}">
                        <span data-i18n="view_profile">Profile</span>
                    </button>
                    <button class="action-btn-small remove-friend-btn" data-friendship-id="${friend.friendship_id}">
                        <span data-i18n="remove_friend">Remove</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderRequestsTab() {
        return `
            <div class="requests-container">
                <div class="requests-section">
                    <h3 data-i18n="received_requests">Received Requests</h3>
                    ${this.receivedRequests.length === 0
                        ? `<p class="empty-message" data-i18n="no_received_requests">No pending requests</p>`
                        : `<div class="requests-list">
                            ${this.receivedRequests.map(req => this.renderReceivedRequest(req)).join('')}
                           </div>`
                    }
                </div>

                <div class="requests-section">
                    <h3 data-i18n="sent_requests">Sent Requests</h3>
                    ${this.sentRequests.length === 0
                        ? `<p class="empty-message" data-i18n="no_sent_requests">No pending sent requests</p>`
                        : `<div class="requests-list">
                            ${this.sentRequests.map(req => this.renderSentRequest(req)).join('')}
                           </div>`
                    }
                </div>
            </div>
        `;
    }

    renderReceivedRequest(request) {
        return `
            <div class="request-card">
                <div class="request-avatar">
                    ${request.avatar_url
                        ? `<img src="${request.avatar_url}" alt="${request.username}">`
                        : `<div class="avatar-placeholder">${request.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="request-info">
                    <h4>${request.username}</h4>
                    <p class="request-date">${this.formatDate(request.created_at)}</p>
                </div>
                <div class="request-actions">
                    <button class="accept-btn" data-friendship-id="${request.friendship_id}">
                        <span data-i18n="accept">Accept</span>
                    </button>
                    <button class="decline-btn" data-friendship-id="${request.friendship_id}">
                        <span data-i18n="decline">Decline</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderSentRequest(request) {
        return `
            <div class="request-card">
                <div class="request-avatar">
                    ${request.avatar_url
                        ? `<img src="${request.avatar_url}" alt="${request.username}">`
                        : `<div class="avatar-placeholder">${request.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="request-info">
                    <h4>${request.username}</h4>
                    <p class="request-date">${this.formatDate(request.created_at)}</p>
                </div>
                <div class="request-status">
                    <span class="status-badge pending" data-i18n="pending">Pending</span>
                </div>
            </div>
        `;
    }

    renderSearchTab() {
        return `
            <div class="search-container">
                <div class="search-box">
                    <input type="text"
                           id="friendSearchInput"
                           class="search-input"
                           placeholder="Search by username..."
                           data-i18n-placeholder="search_username">
                    <button class="search-btn" id="friendSearchBtn">
                        <span data-i18n="search">Search</span>
                    </button>
                </div>

                <div class="search-results" id="friendSearchResults">
                    ${this.searchResults.length === 0
                        ? `<p class="empty-message" data-i18n="search_hint">Enter a username to find friends</p>`
                        : `<div class="search-results-list">
                            ${this.searchResults.map(user => this.renderSearchResult(user)).join('')}
                           </div>`
                    }
                </div>
            </div>
        `;
    }

    renderSearchResult(user) {
        const isSelf = user.id === this.userId;
        const isFriend = this.friends.some(f => f.friend_id === user.id);
        const hasSentRequest = this.sentRequests.some(r => r.friend_id === user.id);

        return `
            <div class="search-result-card">
                <div class="result-avatar">
                    ${user.avatar_url
                        ? `<img src="${user.avatar_url}" alt="${user.username}">`
                        : `<div class="avatar-placeholder">${user.username.charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="result-info">
                    <h4>${user.username}</h4>
                    <p>Level ${user.level || 1} • ${user.total_xp || 0} XP</p>
                </div>
                <div class="result-actions">
                    ${isSelf
                        ? `<span class="status-badge self" data-i18n="you">You</span>`
                        : isFriend
                            ? `<span class="status-badge friend" data-i18n="already_friends">Friends</span>`
                            : hasSentRequest
                                ? `<span class="status-badge pending" data-i18n="request_sent">Request Sent</span>`
                                : `<button class="action-btn-small add-friend-btn" data-user-id="${user.id}">
                                    <span data-i18n="add_friend">Add Friend</span>
                                   </button>`
                    }
                </div>
            </div>
        `;
    }

    renderActivityFeed() {
        if (this.activities.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📰</div>
                    <h3 data-i18n="no_activity">No activity yet</h3>
                    <p data-i18n="activity_hint">Friend activities will appear here</p>
                </div>
            `;
        }

        return `
            <div class="activity-feed">
                ${this.activities.map(activity => this.renderActivity(activity)).join('')}
            </div>
        `;
    }

    renderActivity(activity) {
        const icon = this.getActivityIcon(activity.activity_type);
        const message = this.getActivityMessage(activity);

        return `
            <div class="activity-card">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <p class="activity-message">${message}</p>
                    <p class="activity-time">${this.formatDate(activity.created_at)}</p>
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'achievement_unlocked': '🏆',
            'level_up': '⬆️',
            'friend_request_sent': '✉️',
            'friend_request_accepted': '✅',
            'became_friends': '👥'
        };
        return icons[type] || '📌';
    }

    getActivityMessage(activity) {
        const data = activity.activity_data || {};
        switch (activity.activity_type) {
            case 'achievement_unlocked':
                return `Unlocked achievement: ${data.achievement_name || 'Unknown'}`;
            case 'level_up':
                return `Reached level ${data.new_level || '?'}`;
            case 'friend_request_sent':
                return `Sent friend request`;
            case 'friend_request_accepted':
                return `Accepted friend request`;
            case 'became_friends':
                return `Became friends with ${data.friend_username || 'someone'}`;
            default:
                return 'Activity';
        }
    }

    attachActionListeners(container) {
        // Search button
        const searchBtn = container.querySelector('#friendSearchBtn');
        const searchInput = container.querySelector('#friendSearchInput');
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => this.searchUsers(searchInput.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchUsers(searchInput.value);
                }
            });
        }

        // Add friend buttons
        container.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-user-id');
                this.sendFriendRequest(parseInt(userId));
            });
        });

        // Accept/Decline buttons
        container.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendshipId = e.currentTarget.getAttribute('data-friendship-id');
                this.acceptFriendRequest(parseInt(friendshipId));
            });
        });

        container.querySelectorAll('.decline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendshipId = e.currentTarget.getAttribute('data-friendship-id');
                this.declineFriendRequest(parseInt(friendshipId));
            });
        });

        // Remove friend buttons
        container.querySelectorAll('.remove-friend-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const friendshipId = e.currentTarget.getAttribute('data-friendship-id');
                this.removeFriend(parseInt(friendshipId));
            });
        });

        // View profile buttons
        container.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-user-id');
                if (userId && window.profileUI) {
                    window.profileUI.viewProfile(parseInt(userId));
                }
            });
        });

        // Switch tab buttons (in empty states)
        container.querySelectorAll('.switch-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;
        this.currentTab = tab;
        this.render();
    }

    async searchUsers(query) {
        if (!query || query.trim().length < 2) {
            if (window.showToast) {
                showToast('Please enter at least 2 characters', 'warning');
            }
            return;
        }

        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }

            this.searchResults = await response.json();
            this.render();
        } catch (error) {
            console.error('Error searching users:', error);
            if (window.showToast) {
                showToast('Search failed', 'error');
            }
        }
    }

    async sendFriendRequest(friendId) {
        try {
            const response = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, friendId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send friend request');
            }

            if (window.showToast) {
                showToast('Friend request sent!', 'success');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error sending friend request:', error);
            if (window.showToast) {
                showToast(error.message, 'error');
            }
        }
    }

    async acceptFriendRequest(friendshipId) {
        try {
            const response = await fetch(`/api/friends/accept/${friendshipId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId })
            });

            if (!response.ok) {
                throw new Error('Failed to accept friend request');
            }

            if (window.showToast) {
                showToast('Friend request accepted!', 'success');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error accepting friend request:', error);
            if (window.showToast) {
                showToast('Failed to accept request', 'error');
            }
        }
    }

    async declineFriendRequest(friendshipId) {
        try {
            const response = await fetch(`/api/friends/decline/${friendshipId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId })
            });

            if (!response.ok) {
                throw new Error('Failed to decline friend request');
            }

            if (window.showToast) {
                showToast('Friend request declined', 'info');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error declining friend request:', error);
            if (window.showToast) {
                showToast('Failed to decline request', 'error');
            }
        }
    }

    async removeFriend(friendshipId) {
        if (!confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            const response = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId })
            });

            if (!response.ok) {
                throw new Error('Failed to remove friend');
            }

            if (window.showToast) {
                showToast('Friend removed', 'info');
            }

            await this.refresh();
        } catch (error) {
            console.error('Error removing friend:', error);
            if (window.showToast) {
                showToast('Failed to remove friend', 'error');
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    async refresh() {
        if (!userManager.hasGamificationAccess()) return;

        try {
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error refreshing friends:', error);
        }
    }

    showError(message) {
        const container = document.getElementById('friendsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <p style="color: #ef4444;">${message}</p>
                <button class="action-btn retry-btn" style="margin-top: 1rem;">
                    <span data-i18n="try_again">Try Again</span>
                </button>
            </div>
        `;

        const retryBtn = container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.refresh());
        }
    }
}

// Initialize
const friendsUI = new FriendsUI();
window.friendsUI = friendsUI;
