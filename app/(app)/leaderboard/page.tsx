"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { 
  LeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardType,
  User,
  Friendship,
  UserPrivacySettings
} from "@/lib/types"
import { Trophy, Medal, Award, Users, TrendingUp, Activity } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

interface LeaderboardData {
  user_id: string
  email: string
  workout_completions: number
  food_entries: number
  hour_logs: number
  total_minutes_logged: number
}

// Helper function to calculate score
function calculateScore(data: LeaderboardData, type: LeaderboardType): number {
  if (type === 'fitness') {
    return data.workout_completions * 10 + data.food_entries
  }
  return data.total_minutes_logged
}

// Default duration for hour logs that don't have a duration set
const DEFAULT_HOUR_DURATION_MINUTES = 60

// Time constants for date calculations
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000
const DAYS_IN_WEEK = 7
const DAYS_IN_MONTH = 30 // Using 30 days as an approximation for "last month"

// Earliest date for all-time queries
const ALL_TIME_START_DATE = '2000-01-01'

export default function LeaderboardPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('fitness')
  const [period, setPeriod] = useState<LeaderboardPeriod>('month')
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [hasNoFriends, setHasNoFriends] = useState(false)
  const [hasNoPublicData, setHasNoPublicData] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userId) {
      fetchLeaderboardData()
    }
    // fetchLeaderboardData is defined in component scope and depends on state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, leaderboardType, period])

  const getDateRange = (): { startDate: string, endDate: string } => {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]
    
    let startDate: string
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - DAYS_IN_WEEK * MILLISECONDS_IN_DAY)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - DAYS_IN_MONTH * MILLISECONDS_IN_DAY)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      case 'all_time':
        startDate = ALL_TIME_START_DATE
        break
    }
    
    return { startDate, endDate }
  }

  const fetchLeaderboardData = async () => {
    if (!userId) return

    setLoading(true)
    setHasNoFriends(false)
    setHasNoPublicData(false)

    try {
      // Get accepted friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (friendshipsError) throw friendshipsError

      if (!friendships || friendships.length === 0) {
        setHasNoFriends(true)
        setLeaderboardData([])
        setLoading(false)
        return
      }

      // Get friend IDs
      const friendIds = friendships.map((f: Friendship) => 
        f.user_id === userId ? f.friend_id : f.user_id
      )

      // Include current user in the list
      const allUserIds = [userId, ...friendIds]

      // Get privacy settings for all users
      const { data: privacySettings, error: privacyError } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .in('user_id', allUserIds)

      if (privacyError) throw privacyError

      // Filter users based on privacy settings
      const publicDataField = leaderboardType === 'fitness' ? 'fitness_public' : 'analytics_public'
      const usersWithPublicData = privacySettings
        ?.filter((ps: UserPrivacySettings) => ps[publicDataField] || ps.user_id === userId)
        .map(ps => ps.user_id) || []

      if (usersWithPublicData.length === 0) {
        setHasNoPublicData(true)
        setLeaderboardData([])
        setLoading(false)
        return
      }

      // Get user emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', usersWithPublicData)

      if (usersError) throw usersError

      const userMap = new Map(users?.map((u: { id: string, email: string }) => [u.id, u.email]) || [])

      // Get date range
      const { startDate, endDate } = getDateRange()

      // Fetch metrics based on leaderboard type using parallel queries
      const metricsData: LeaderboardData[] = await Promise.all(
        usersWithPublicData.map(async (uId) => {
          const email = userMap.get(uId) || 'Unknown'

          if (leaderboardType === 'fitness') {
            // Count workout completions and food entries in parallel
            const [workoutsResult, foodsResult] = await Promise.all([
              supabase
                .from('workout_completions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', uId)
                .eq('completed', true)
                .gte('date', startDate)
                .lte('date', endDate),
              supabase
                .from('food_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', uId)
                .gte('date', startDate)
                .lte('date', endDate)
            ])

            if (workoutsResult.error) throw workoutsResult.error
            if (foodsResult.error) throw foodsResult.error

            const workoutCount = workoutsResult.count || 0
            const foodCount = foodsResult.count || 0

            return {
              user_id: uId,
              email,
              workout_completions: workoutCount,
              food_entries: foodCount,
              hour_logs: 0,
              total_minutes_logged: 0
            }
          } else {
            // Analytics: Fetch hour logs by joining with days table
            // First get the days in the date range
            const { data: days, error: daysError } = await supabase
              .from('days')
              .select('id')
              .eq('user_id', uId)
              .gte('date', startDate)
              .lte('date', endDate)

            if (daysError) throw daysError

            const dayIds = days?.map(d => d.id) || []
            
            if (dayIds.length === 0) {
              return {
                user_id: uId,
                email,
                workout_completions: 0,
                food_entries: 0,
                hour_logs: 0,
                total_minutes_logged: 0
              }
            }

            // Fetch hour logs for those days
            const { data: hourLogs, error: hourLogsError } = await supabase
              .from('hour_logs')
              .select('duration_minutes')
              .in('day_id', dayIds)

            if (hourLogsError) throw hourLogsError

            const logCount = hourLogs?.length || 0
            const totalMinutes = hourLogs?.reduce((sum, log) => sum + (log.duration_minutes || DEFAULT_HOUR_DURATION_MINUTES), 0) || 0

            return {
              user_id: uId,
              email,
              workout_completions: 0,
              food_entries: 0,
              hour_logs: logCount,
              total_minutes_logged: totalMinutes
            }
          }
        })
      )

      // Sort by score and create leaderboard entries
      metricsData.sort((a, b) => {
        const scoreA = calculateScore(a, leaderboardType)
        const scoreB = calculateScore(b, leaderboardType)
        return scoreB - scoreA
      })

      const leaderboard: LeaderboardEntry[] = metricsData.map((data, index) => {
        const score = calculateScore(data, leaderboardType)

        return {
          user_id: data.user_id,
          email: data.email,
          score,
          rank: index + 1,
          is_current_user: data.user_id === userId
        }
      })

      setLeaderboardData(leaderboard)
    } catch (error) {
      console.error('Error fetching leaderboard data:', error)
      setLeaderboardData([])
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (email: string): string => {
    return email.charAt(0).toUpperCase()
  }

  const getEmailPrefix = (email: string): string => {
    return email.split('@')[0]
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm text-muted font-medium">#{rank}</span>
    }
  }

  const getScoreLabel = () => {
    if (leaderboardType === 'fitness') {
      return 'Points'
    }
    return 'Minutes'
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
      case 'all_time':
        return 'All Time'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-10">
        <PageHeader 
          title="Leaderboard" 
          subtitle="Compare progress with friends"
        />

        {/* Type and Period Filters */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Leaderboard Type Selector */}
            <div className="flex-1">
              <label className="block text-xs tracking-wide text-muted font-medium mb-2">
                LEADERBOARD TYPE
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeaderboardType('fitness')}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    leaderboardType === 'fitness'
                      ? "bg-white/[0.08] text-primary border border-white/[0.12]"
                      : "bg-white/[0.02] text-muted hover:text-secondary border border-white/[0.06] hover:border-white/[0.08]"
                  )}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  Fitness
                </button>
                <button
                  onClick={() => setLeaderboardType('analytics')}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    leaderboardType === 'analytics'
                      ? "bg-white/[0.08] text-primary border border-white/[0.12]"
                      : "bg-white/[0.02] text-muted hover:text-secondary border border-white/[0.06] hover:border-white/[0.08]"
                  )}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Analytics
                </button>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex-1">
              <label className="block text-xs tracking-wide text-muted font-medium mb-2">
                TIME PERIOD
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('week')}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    period === 'week'
                      ? "bg-white/[0.08] text-primary border border-white/[0.12]"
                      : "bg-white/[0.02] text-muted hover:text-secondary border border-white/[0.06] hover:border-white/[0.08]"
                  )}
                >
                  Week
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    period === 'month'
                      ? "bg-white/[0.08] text-primary border border-white/[0.12]"
                      : "bg-white/[0.02] text-muted hover:text-secondary border border-white/[0.06] hover:border-white/[0.08]"
                  )}
                >
                  Month
                </button>
                <button
                  onClick={() => setPeriod('all_time')}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    period === 'all_time'
                      ? "bg-white/[0.08] text-primary border border-white/[0.12]"
                      : "bg-white/[0.02] text-muted hover:text-secondary border border-white/[0.06] hover:border-white/[0.08]"
                  )}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader>
              {leaderboardType === 'fitness' ? 'Fitness' : 'Analytics'} Rankings • {getPeriodLabel()}
            </SectionHeader>
            {leaderboardData.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-secondary bg-white/[0.06] rounded-full">
                {leaderboardData.length} {leaderboardData.length === 1 ? 'person' : 'people'}
              </span>
            )}
          </div>

          {hasNoFriends ? (
            <EmptyState
              icon={<Users className="w-10 h-10" />}
              title="No friends yet"
              description="Add friends to see leaderboard rankings"
            />
          ) : hasNoPublicData ? (
            <EmptyState
              icon={<Trophy className="w-10 h-10" />}
              title="No public data available"
              description={`Your friends haven't made their ${leaderboardType} data public yet`}
            />
          ) : leaderboardData.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-10 h-10" />}
              title="No data yet"
              description={`No ${leaderboardType} activity found for this period`}
            />
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((entry) => (
                <Card 
                  key={entry.user_id} 
                  className={cn(
                    "p-5",
                    entry.is_current_user && "border-white/[0.16] bg-white/[0.04] ring-1 ring-white/[0.08]"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 flex items-center justify-center shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.1] to-white/[0.05] flex items-center justify-center text-base font-medium text-primary border border-white/[0.1] shrink-0">
                      {getInitials(entry.email)}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          entry.is_current_user ? "text-primary" : "text-secondary"
                        )}>
                          {getEmailPrefix(entry.email)}
                        </p>
                        {entry.is_current_user && (
                          <span className="px-2 py-0.5 text-xs font-medium text-primary bg-white/[0.08] rounded-full shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {entry.email}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-light text-primary tabular-nums">
                        {entry.score}
                      </p>
                      <p className="text-xs text-muted tracking-wide">
                        {getScoreLabel()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Info Note */}
        {!hasNoFriends && !hasNoPublicData && leaderboardData.length > 0 && (
          <div className="px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <p className="text-xs text-muted leading-relaxed">
              {leaderboardType === 'fitness' 
                ? 'Fitness points: Each workout completion = 10 points, each food entry = 1 point'
                : 'Analytics score based on total minutes of time logged'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
