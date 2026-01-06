"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Friendship, User, FriendshipStatus } from "@/lib/types"
import { Search, UserPlus, Check, X, UserMinus, Users, Mail, Clock } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { TextField } from "@/components/ui/text-field"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

interface FriendWithUser extends Friendship {
  friend_user?: User
  user_user?: User
}

export default function FriendsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<User | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  
  const [friendships, setFriendships] = useState<FriendWithUser[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [supabase])

  useEffect(() => {
    if (userId) {
      fetchFriendships()
    }
  }, [userId, supabase])

  const fetchFriendships = async () => {
    if (!userId) return

    setLoading(true)
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend_user:users!friendships_friend_id_fkey(id, email),
        user_user:users!friendships_user_id_fkey(id, email)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching friendships:', error)
    }

    if (data) {
      setFriendships(data as FriendWithUser[])
    }

    setLoading(false)
  }

  const searchUser = async () => {
    if (!searchEmail.trim() || !userId) return

    setSearching(true)
    setSearchError(null)
    setSearchResult(null)

    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', `%${searchEmail.trim()}%`)
      .neq('id', userId)
      .limit(1)

    if (error) {
      setSearchError('Error searching for user')
      setSearchResult(null)
    } else if (!data || data.length === 0) {
      setSearchError('User not found')
      setSearchResult(null)
    } else {
      const foundUser = data[0]
      
      // Check if friendship already exists
      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${userId},friend_id.eq.${foundUser.id}),and(user_id.eq.${foundUser.id},friend_id.eq.${userId})`)

      if (existingFriendships && existingFriendships.length > 0) {
        setSearchError('Friendship already exists')
        setSearchResult(null)
      } else {
        setSearchResult(foundUser as User)
      }
    }

    setSearching(false)
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!userId) return

    setActionLoading(friendId)
    setActionError(null)

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })

    if (error) {
      setActionError('Failed to send friend request')
      console.error('Error sending friend request:', error)
      setTimeout(() => setActionError(null), 3000)
    } else {
      setSearchResult(null)
      setSearchEmail("")
      fetchFriendships()
    }

    setActionLoading(null)
  }

  const acceptFriendRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    setActionError(null)

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (error) {
      setActionError('Failed to accept friend request')
      console.error('Error accepting friend request:', error)
      setTimeout(() => setActionError(null), 3000)
    } else {
      fetchFriendships()
    }

    setActionLoading(null)
  }

  const rejectFriendRequest = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    setActionError(null)

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) {
      setActionError('Failed to reject friend request')
      console.error('Error rejecting friend request:', error)
      setTimeout(() => setActionError(null), 3000)
    } else {
      fetchFriendships()
    }

    setActionLoading(null)
  }

  const removeFriend = async (friendshipId: string) => {
    setActionLoading(friendshipId)
    setActionError(null)

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) {
      setActionError('Failed to remove friend')
      console.error('Error removing friend:', error)
      setTimeout(() => setActionError(null), 3000)
    } else {
      fetchFriendships()
    }

    setActionLoading(null)
  }

  const pendingReceived = friendships.filter(
    f => f.friend_id === userId && f.status === 'pending'
  )
  const pendingSent = friendships.filter(
    f => f.user_id === userId && f.status === 'pending'
  )
  const acceptedFriendships = friendships.filter(
    f => f.status === 'accepted'
  )

  const getFriendUser = (friendship: FriendWithUser): User | null => {
    if (friendship.user_id === userId) {
      return friendship.friend_user || null
    }
    return friendship.user_user || null
  }

  const getInitials = (email: string): string => {
    return email.charAt(0).toUpperCase()
  }

  const getEmailPrefix = (email: string): string => {
    return email.split('@')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-10">
        <PageHeader title="Friends" />

        {/* Search Section */}
        <section className="space-y-4">
          <SectionHeader>Find Friends</SectionHeader>
          <Card>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <TextField
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Search by email address..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchUser()
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={searchUser}
                  disabled={searching || !searchEmail.trim()}
                  variant="outline"
                  className="shrink-0"
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>

              {searchError && (
                <div className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <p className="text-sm text-muted">{searchError}</p>
                </div>
              )}

              {actionError && (
                <div className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <p className="text-sm text-muted">{actionError}</p>
                </div>
              )}

              {searchResult && (
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] animate-fade">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.1] to-white/[0.05] flex items-center justify-center text-base font-medium text-primary border border-white/[0.1] shrink-0">
                        {getInitials(searchResult.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{getEmailPrefix(searchResult.email)}</p>
                        <p className="text-xs text-muted truncate">{searchResult.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => sendFriendRequest(searchResult.id)}
                      disabled={actionLoading === searchResult.id}
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      {actionLoading === searchResult.id ? "Sending..." : "Add Friend"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Pending Requests Received */}
        {pendingReceived.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <SectionHeader>Friend Requests</SectionHeader>
              <span className="px-2 py-0.5 text-xs font-medium text-secondary bg-white/[0.06] rounded-full">
                {pendingReceived.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingReceived.map((friendship) => {
                const friendUser = getFriendUser(friendship)
                if (!friendUser) return null

                return (
                  <Card key={friendship.id} variant="interactive" className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.1] to-white/[0.05] flex items-center justify-center text-base font-medium text-primary border border-white/[0.1] shrink-0">
                          {getInitials(friendUser.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary truncate">{getEmailPrefix(friendUser.email)}</p>
                          <p className="text-xs text-muted truncate flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {friendUser.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => acceptFriendRequest(friendship.id)}
                          disabled={actionLoading === friendship.id}
                          size="sm"
                          variant="outline"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => rejectFriendRequest(friendship.id)}
                          disabled={actionLoading === friendship.id}
                          size="sm"
                          variant="ghost"
                          className="text-muted hover:text-primary"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Pending Requests Sent */}
        {pendingSent.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <SectionHeader>Sent Requests</SectionHeader>
              <span className="px-2 py-0.5 text-xs font-medium text-secondary bg-white/[0.06] rounded-full">
                {pendingSent.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingSent.map((friendship) => {
                const friendUser = getFriendUser(friendship)
                if (!friendUser) return null

                return (
                  <Card key={friendship.id} className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.1] to-white/[0.05] flex items-center justify-center text-base font-medium text-primary border border-white/[0.1] shrink-0">
                        {getInitials(friendUser.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{getEmailPrefix(friendUser.email)}</p>
                        <p className="text-xs text-muted truncate flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          Pending acceptance
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <SectionHeader>Friends</SectionHeader>
            {acceptedFriendships.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-secondary bg-white/[0.06] rounded-full">
                {acceptedFriendships.length}
              </span>
            )}
          </div>
          {acceptedFriendships.length === 0 ? (
            <EmptyState
              icon={<Users className="w-10 h-10" />}
              title="No friends yet"
              description="Search for users by email to add friends"
            />
          ) : (
            <div className="space-y-3">
              {acceptedFriendships.map((friendship) => {
                const friendUser = getFriendUser(friendship)
                if (!friendUser) return null

                return (
                  <Card key={friendship.id} variant="interactive" className="p-5 group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.1] to-white/[0.05] flex items-center justify-center text-base font-medium text-primary border border-white/[0.1] shrink-0">
                          {getInitials(friendUser.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-primary truncate">{getEmailPrefix(friendUser.email)}</p>
                          <p className="text-xs text-muted truncate flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {friendUser.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFriend(friendship.id)}
                        disabled={actionLoading === friendship.id}
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-primary shrink-0"
                      >
                        <UserMinus className="w-4 h-4" />
                        {actionLoading === friendship.id ? "..." : "Remove"}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
