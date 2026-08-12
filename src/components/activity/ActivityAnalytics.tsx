import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react';
import { useActivityLogStore } from '../../store/activityLogStore';
import { ActivityLog } from '../../types';

const ActivityAnalytics: React.FC = () => {
  const { logs, loading, fetchRecentLogs } = useActivityLogStore();
  const [stats, setStats] = useState({
    totalActivities: 0,
    topUsers: [] as { name: string; count: number; role: string }[],
    topActions: [] as { action: string; count: number }[],
    activityByRole: [] as { role: string; count: number }[],
    activityByEntity: [] as { entity: string; count: number }[]
  });

  useEffect(() => {
    fetchRecentLogs(100); // Fetch last 100 activities for analytics
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      calculateStats();
    }
  }, [logs]);

  const calculateStats = () => {
    // Total activities
    const totalActivities = logs.length;

    // Top users
    const userCounts: Record<string, { count: number; role: string }> = {};
    logs.forEach(log => {
      if (!userCounts[log.user_name]) {
        userCounts[log.user_name] = { count: 0, role: log.user_role };
      }
      userCounts[log.user_name].count++;
    });
    const topUsers = Object.entries(userCounts)
      .map(([name, data]) => ({ name, count: data.count, role: data.role }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top actions
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activity by role
    const roleCounts: Record<string, number> = {};
    logs.forEach(log => {
      roleCounts[log.user_role] = (roleCounts[log.user_role] || 0) + 1;
    });
    const activityByRole = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    // Activity by entity type
    const entityCounts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.entity_type) {
        entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
      }
    });
    const activityByEntity = Object.entries(entityCounts)
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalActivities,
      topUsers,
      topActions,
      activityByRole,
      activityByEntity
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'manager': return 'text-blue-400';
      case 'customer': return 'text-green-400';
      default: return 'text-neutral-400';
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-900/30';
      case 'manager': return 'bg-blue-900/30';
      case 'customer': return 'bg-green-900/30';
      default: return 'bg-neutral-900/30';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="w-8 h-8 animate-spin text-green-400" />
        <span className="ml-3 text-neutral-400">Analytics laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="vl-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.totalActivities}</p>
          <p className="text-sm text-neutral-400">Totaal Activiteiten</p>
        </div>

        <div className="vl-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.topUsers.length}</p>
          <p className="text-sm text-neutral-400">Actieve Gebruikers</p>
        </div>

        <div className="vl-card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.topActions.length}</p>
          <p className="text-sm text-neutral-400">Unieke Acties</p>
        </div>

        <div className="vl-card p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats.activityByEntity.length}</p>
          <p className="text-sm text-neutral-400">Entity Types</p>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="vl-card p-5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Top 5 Meest Actieve Gebruikers
          </h3>
          <div className="space-y-3">
            {stats.topUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full ${getRoleBgColor(user.role)} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${getRoleColor(user.role)}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className={`text-xs ${getRoleColor(user.role)} capitalize`}>{user.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{user.count}</p>
                  <p className="text-xs text-neutral-500">acties</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Actions */}
        <div className="vl-card p-5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Top 5 Meest Voorkomende Acties
          </h3>
          <div className="space-y-3">
            {stats.topActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-white font-mono">{action.action}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{action.count}</p>
                  <p className="text-xs text-neutral-500">keer</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity by Role */}
        <div className="vl-card p-5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Activiteit per Rol
          </h3>
          <div className="space-y-3">
            {stats.activityByRole.map((role, index) => {
              const percentage = ((role.count / stats.totalActivities) * 100).toFixed(1);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${getRoleColor(role.role)} capitalize`}>
                      {role.role}
                    </span>
                    <span className="text-sm text-white font-bold">{role.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRoleBgColor(role.role)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity by Entity Type */}
        <div className="vl-card p-5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            Activiteit per Entity Type
          </h3>
          <div className="space-y-3">
            {stats.activityByEntity.map((entity, index) => {
              const percentage = ((entity.count / stats.totalActivities) * 100).toFixed(1);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white capitalize">
                      {entity.entity}
                    </span>
                    <span className="text-sm text-white font-bold">{entity.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-900/50"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityAnalytics;
