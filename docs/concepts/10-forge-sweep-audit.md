# F0 Token Sweep Audit — pre-edit snapshot (2026-07-20)

Scope: src/components + src/app, excluding components/3d, components/games, components/bits, app/dev (logged exclusions).

## Full occurrence list (plan §5.1.1 regex)

```
src/components/streak/StreakCalendar.tsx:32:    <div className={`rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4 ${className}`}>
src/components/streak/StreakCalendar.tsx:39:        <span className="text-xs text-slate-400">
src/components/streak/StreakCalendar.tsx:47:          <div key={day} className="text-center text-[10px] text-slate-500 font-medium">
src/components/streak/StreakCalendar.tsx:65:        <LegendItem color="bg-slate-700" label="Missed" />
src/components/streak/StreakCalendar.tsx:74:      return 'bg-slate-800/30 border-slate-700/10';
src/components/streak/StreakCalendar.tsx:80:      return 'bg-slate-700 border-orange-400 ring-2 ring-orange-400/50';
src/components/streak/StreakCalendar.tsx:94:    return 'bg-slate-800 border-slate-700/30';
src/components/streak/StreakCalendar.tsx:98:    if (day.freezeUsed) return <Snowflake className="w-2.5 h-2.5 text-cyan-300" />;
src/components/streak/StreakCalendar.tsx:138:      <span className="text-[10px] text-slate-400">{label}</span>
src/components/streak/StreakFreezeCard.tsx:58:      <div className="rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4">
src/components/streak/StreakFreezeCard.tsx:62:            <Shield className="w-5 h-5 text-cyan-400" />
src/components/streak/StreakFreezeCard.tsx:67:              <button className="text-slate-400 hover:text-white transition-colors">
src/components/streak/StreakFreezeCard.tsx:96:                      ? 'bg-slate-800 border-slate-600 cursor-pointer hover:border-cyan-400/50'
src/components/streak/StreakFreezeCard.tsx:97:                      : 'bg-slate-800/50 border-slate-700/30 opacity-50'
src/components/streak/StreakFreezeCard.tsx:112:                      <ShieldCheck className="w-7 h-7 text-cyan-400" />
src/components/streak/StreakFreezeCard.tsx:121:                      <Shield className="w-7 h-7 text-slate-500" />
src/components/streak/StreakFreezeCard.tsx:130:                      <ShieldOff className="w-7 h-7 text-slate-600" />
src/components/streak/StreakFreezeCard.tsx:150:          <p className="text-xs text-slate-400">
src/components/streak/StreakFreezeCard.tsx:152:              <span className="text-cyan-400">
src/components/streak/StreakCounter.tsx:73:          <Shield className="w-3 h-3 text-cyan-400" />
src/components/streak/StreakCounter.tsx:132:              <Shield className="w-4 h-4 text-cyan-400" />
src/components/streak/StreakCounter.tsx:133:              <span className="text-xs text-cyan-300">{freezesEquipped}</span>
src/components/streak/StreakWagerModal.tsx:72:            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/50 shadow-2xl overflow-hidden"
src/components/streak/StreakWagerModal.tsx:78:                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 transition-colors"
src/components/streak/StreakWagerModal.tsx:80:                <X className="w-5 h-5 text-slate-400" />
src/components/streak/StreakWagerModal.tsx:88:                  <p className="text-xs text-slate-400">Free to enter · Win gems</p>
src/components/streak/StreakWagerModal.tsx:116:                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
src/components/streak/StreakWagerModal.tsx:128:                      <p className="text-xs text-slate-400">Maintain streak for 7 days</p>
src/components/streak/StreakWagerModal.tsx:133:                    <p className="text-xs text-slate-500">gems</p>
src/components/streak/StreakWagerModal.tsx:146:                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
src/components/streak/StreakWagerModal.tsx:154:                      <Target className="w-4 h-4 text-purple-400" />
src/components/streak/StreakWagerModal.tsx:158:                      <p className="text-xs text-slate-400">
src/components/streak/StreakWagerModal.tsx:164:                    <p className="text-lg font-bold text-purple-400">+100</p>
src/components/streak/StreakWagerModal.tsx:165:                    <p className="text-xs text-slate-500">gems</p>
src/components/streak/StreakWagerModal.tsx:209:              <p className="mt-3 text-center text-xs text-slate-500">
src/components/badges/BadgeUnlockAnimation.tsx:105:              className="relative rounded-3xl bg-slate-900/95 border-2 p-8 text-center overflow-hidden"
src/components/badges/BadgeUnlockAnimation.tsx:114:                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 transition-colors z-10"
src/components/badges/BadgeUnlockAnimation.tsx:116:                <X className="w-4 h-4 text-slate-400" />
src/components/badges/BadgeUnlockAnimation.tsx:198:                className="text-sm text-slate-400 mb-6"
src/components/badges/BadgeUnlockAnimation.tsx:218:                    <Sparkles className="w-4 h-4 text-purple-400" />
src/components/badges/BadgeUnlockAnimation.tsx:219:                    <span className="text-sm font-semibold text-purple-400">+{badge.xpReward} XP</span>
src/components/ui/GuideMobileAvatar.tsx:75:      <Sparkles className={`${ICON_SIZES[size]} text-cyan-400`} />
src/components/ui/GuideHintBubble.tsx:73:              <Sparkles className="w-4 h-4 mt-0.5 text-cyan-300 shrink-0" aria-hidden="true" />
src/components/ui/GuideChatPanel.tsx:184:        <Sparkles className="w-4 h-4 text-cyan-400" />
src/components/ui/GuideChatPanel.tsx:203:          <Sparkles className="w-4 h-4 text-cyan-400" />
src/components/ui/GuideChatPanel.tsx:221:            <Sparkles className="w-8 h-8 mx-auto mb-2 text-cyan-400/30" />
src/components/ui/GuideChatPanel.tsx:270:            className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/60'}`}
src/components/ui/GuideChatPanel.tsx:304:            className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-500/30 transition-colors"
src/components/ui/GuideChatPanel.tsx:313:          <p className="text-xs text-cyan-400/60 font-body mt-1 truncate">
src/components/auth/PasswordStrengthMeter.tsx:38:  good: 'text-blue-400',
src/components/currency/CurrencyDisplay.tsx:83:            bg-slate-800/80 border border-slate-700/50
src/components/currency/CurrencyDisplay.tsx:103:    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4">
src/components/currency/CurrencyDisplay.tsx:112:            <p className="text-[10px] text-slate-400">Spend in the shop</p>
src/components/currency/CurrencyDisplay.tsx:118:            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
src/components/currency/CurrencyDisplay.tsx:177:          bg-slate-800 text-slate-400 text-sm">
src/components/content/BranchingLessonRenderer.tsx:241:      return <BookOpen className="w-4 h-4 text-blue-400" />;
src/components/content/BranchingLessonRenderer.tsx:247:      return <Gamepad2 className="w-4 h-4 text-purple-400" />;
src/components/mission/DailyMissionCard.tsx:153:                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
src/components/mission/DailyMissionCard.tsx:171:                      <p className="text-sm text-slate-300 mb-3">{challenge.description}</p>
src/components/mission/DailyMissionCard.tsx:177:                            <span className="text-slate-400">Progress</span>
src/components/mission/DailyMissionCard.tsx:180:                          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
src/components/mission/DailyMissionCard.tsx:198:                          <Target className="w-3.5 h-3.5 text-purple-400" />
src/components/mission/DailyMissionCard.tsx:199:                          <span className="text-xs font-semibold text-purple-400">
src/components/home/QuickStatsBar.tsx:83:        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/30 cursor-pointer"
src/components/home/QuickStatsBar.tsx:89:          <p className="text-xs text-slate-400">Badges</p>
src/components/home/QuickStatsBar.tsx:92:            <span className="text-slate-500 font-normal">/{stats.totalBadges}</span>
src/components/home/QuickStatsBar.tsx:100:        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/30 cursor-pointer"
src/components/home/QuickStatsBar.tsx:103:          <Target className="w-4.5 h-4.5 text-purple-400" />
src/components/home/QuickStatsBar.tsx:106:          <p className="text-xs text-slate-400">League</p>
src/components/home/QuickStatsBar.tsx:114:      <div className="hidden lg:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/30">
src/components/home/QuickStatsBar.tsx:120:            <p className="text-xs text-slate-400">Level {stats.level}</p>
src/components/home/QuickStatsBar.tsx:121:            <p className="text-[10px] text-slate-500">{Math.round(xpProgress)}%</p>
src/components/home/QuickStatsBar.tsx:123:          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
src/components/home/ActivityFeed.tsx:97:      <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-4 space-y-3">
src/components/home/ActivityFeed.tsx:99:          <div className="w-4 h-4 rounded bg-slate-700 animate-pulse" />
src/components/home/ActivityFeed.tsx:100:          <div className="w-24 h-4 rounded bg-slate-700 animate-pulse" />
src/components/home/ActivityFeed.tsx:104:            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
src/components/home/ActivityFeed.tsx:106:              <div className="w-3/4 h-3 rounded bg-slate-700 animate-pulse" />
src/components/home/ActivityFeed.tsx:107:              <div className="w-1/2 h-2.5 rounded bg-slate-700 animate-pulse" />
src/components/home/ActivityFeed.tsx:117:      <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-6 text-center">
src/components/home/ActivityFeed.tsx:118:        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
src/components/home/ActivityFeed.tsx:119:          <Circle className="w-5 h-5 text-slate-600" />
src/components/home/ActivityFeed.tsx:121:        <p className="text-sm text-slate-400 mb-1">No activity yet</p>
src/components/home/ActivityFeed.tsx:122:        <p className="text-xs text-slate-500">Start playing to see your activity here!</p>
src/components/home/ActivityFeed.tsx:128:    <div className="rounded-2xl bg-slate-900/40 border border-slate-700/20 p-4">
src/components/home/ActivityFeed.tsx:145:              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-slate-800/40 transition-colors"
src/components/home/ActivityFeed.tsx:162:                  {cfg.label} <span className="text-slate-300">{item.title}</span>
src/components/home/ActivityFeed.tsx:165:                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
src/components/home/ActivityFeed.tsx:174:                <p className="text-[10px] text-slate-500">{formatTimeAgo(item.timestamp)}</p>
src/components/pet/PetAvatar.tsx:108:      <p className="text-[10px] text-slate-500">
src/components/pet/PetWidget.tsx:100:              <p className="text-xs text-slate-300 mb-2 line-clamp-2">
src/components/pet/PetWidget.tsx:108:                    <span className="text-[10px] text-slate-500">Needs</span>
src/components/pet/PetWidget.tsx:113:                  <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
src/components/pet/PetWidget.tsx:132:                    <span className="text-[9px] text-slate-400">{pet.consecutiveCareDays}d</span>
src/components/pet/PetWidget.tsx:136:                    <span className="text-[9px] text-slate-400">{pet.tricksLearned.length}</span>
src/components/pet/PetCarePanel.tsx:53:        <span className="text-xs text-slate-400">{label}</span>
src/components/pet/PetCarePanel.tsx:54:        <span className={`text-xs font-semibold ${isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-slate-300'}`}>
src/components/pet/PetCarePanel.tsx:58:      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
src/components/pet/PetCarePanel.tsx:101:    <div className="relative rounded-2xl bg-slate-900/60 border border-slate-700/30 p-4 space-y-4">
src/components/pet/PetCarePanel.tsx:115:            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
src/components/pet/PetCarePanel.tsx:155:      <div className="flex items-center gap-2 text-xs text-slate-400">
src/components/pet/PetCarePanel.tsx:178:                  ? 'opacity-40 cursor-not-allowed bg-slate-800'
src/components/pet/PetCarePanel.tsx:199:              <span className="text-[10px] font-medium text-slate-300">{label}</span>
src/components/pet/PetCarePanel.tsx:201:                <span className="text-[9px] text-slate-500">{cost} CP</span>
src/components/pet/PetCarePanel.tsx:215:            className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center backdrop-blur-sm"
src/components/pet/PetCarePanel.tsx:220:              <p className="text-xs text-slate-400">Energy recovering</p>
src/components/pet/PetEvolutionModal.tsx:55:            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/50 p-6 relative overflow-hidden"
src/components/pet/PetEvolutionModal.tsx:58:            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 transition-colors z-10">
src/components/pet/PetEvolutionModal.tsx:59:              <X className="w-4 h-4 text-slate-400" />
src/components/pet/PetEvolutionModal.tsx:69:                  className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95"
src/components/pet/PetEvolutionModal.tsx:85:                    <p className="text-sm text-slate-400">
src/components/pet/PetEvolutionModal.tsx:120:                <p className="text-xs text-slate-400">
src/components/pet/PetEvolutionModal.tsx:127:            <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
src/components/pet/PetEvolutionModal.tsx:128:              <p className="text-xs text-slate-400 mb-1">Current Stage</p>
src/components/pet/PetEvolutionModal.tsx:133:                  <p className="text-xs text-slate-500">Day {pet.ageDays}</p>
src/components/pet/PetEvolutionModal.tsx:140:              <ChevronRight className="w-5 h-5 text-slate-600 rotate-90" />
src/components/pet/PetEvolutionModal.tsx:162:                  <Lock className="w-4 h-4 text-slate-600 ml-auto" />
src/components/pet/PetEvolutionModal.tsx:176:                  <span className={req.startsWith('✅') ? 'text-emerald-400' : 'text-slate-400'}>
src/components/pet/PetEvolutionModal.tsx:193:                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
src/components/quests/QuestPanel.tsx:71:          className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/30"
src/components/quests/QuestPanel.tsx:76:            <span className="text-xs text-slate-300">
src/components/quests/QuestPanel.tsx:80:          <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
src/components/quests/QuestPanel.tsx:115:          <div className="text-center py-6 text-slate-500 text-sm">
src/components/quests/QuestPanel.tsx:141:        <span className="text-[10px] text-slate-500">
src/components/quests/QuestPanel.tsx:167:                    : 'bg-slate-700'
src/components/quests/QuestPanel.tsx:172:              <div className={`w-1 h-1 rounded-full ${step.status === 'completed' ? 'bg-amber-500' : 'bg-slate-700'}`} />
src/components/quests/QuestPanel.tsx:188:          <p className="text-[10px] text-slate-400 mt-0.5">
src/components/quests/QuestCard.tsx:95:            <p className="text-xs text-slate-400 mb-2.5">
src/components/quests/QuestCard.tsx:102:                <span className="text-[10px] text-slate-500">
src/components/quests/QuestCard.tsx:109:              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
src/components/quests/QuestCard.tsx:129:                <span className="flex items-center gap-1 text-[10px] text-cyan-400">
src/components/quests/QuestCard.tsx:133:                <span className="flex items-center gap-1 text-[10px] text-purple-400">
src/components/quests/QuestCard.tsx:161:                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-slate-500 text-[10px] font-medium">
src/components/mechanics/SortingTray.tsx:59:      {title && <p className="text-xs text-slate-400">{title}</p>}
src/components/mechanics/SortingTray.tsx:76:                  ${!submitted ? 'border-slate-700/30 bg-slate-800/40' : ''}
src/components/mechanics/SortingTray.tsx:85:                  ${!submitted ? 'bg-slate-700/50 text-slate-400' : ''}
src/components/mechanics/SortingTray.tsx:100:                  <ArrowUpDown className="w-4 h-4 text-slate-600 shrink-0" />
src/components/mechanics/SortingTray.tsx:110:                    <span className="text-[10px] text-slate-500">#{item.correctPosition + 1}</span>
src/components/mechanics/SortingTray.tsx:135:            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
src/components/mechanics/DragDropZone.tsx:103:      <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3 min-h-[80px]">
src/components/mechanics/DragDropZone.tsx:104:        <p className="text-xs text-slate-400 mb-2">Drag items into the correct zones:</p>
src/components/mechanics/DragDropZone.tsx:145:            <p className="text-xs text-slate-500 italic">All items placed!</p>
src/components/mechanics/DragDropZone.tsx:167:                      : 'border-slate-700/30 bg-slate-800/20'
src/components/mechanics/DragDropZone.tsx:168:                  : 'border-slate-700/30 bg-slate-800/20 hover:border-slate-600/40'
src/components/mechanics/DragDropZone.tsx:184:                  <span className="text-[10px] text-slate-500 ml-auto">{zone.items.length}/{zone.maxItems}</span>
src/components/mechanics/DragDropZone.tsx:226:                  <p className="text-[10px] text-slate-600 italic">Drop items here</p>
src/components/mechanics/DragDropZone.tsx:246:                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
src/components/mechanics/DragDropZone.tsx:257:            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
src/components/mechanics/DragDropZone.tsx:264:          <button className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-slate-300 transition-colors" title="Hint: Read each item carefully and think about what type of data it is.">
src/components/mechanics/ConnectionBoard.tsx:117:      <div className="relative rounded-xl bg-slate-900/60 border border-slate-700/30 overflow-hidden" style={{ minHeight: 300 }}>
src/components/mechanics/ConnectionBoard.tsx:184:              <span className="text-[8px] text-slate-500 capitalize">{node.type}</span>
src/components/mechanics/ConnectionBoard.tsx:197:        <p className="text-xs text-slate-400 text-center">
src/components/mechanics/ConnectionBoard.tsx:214:            <p className="text-slate-400 mt-1">Orange dashed lines show missing connections</p>
src/components/mechanics/ConnectionBoard.tsx:217:            <p className="text-slate-400 mt-1">Red dashed lines are extra/incorrect connections</p>
src/components/mechanics/ConnectionBoard.tsx:238:            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
src/components/mechanics/ChoiceCardDeck.tsx:54:      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
src/components/mechanics/ChoiceCardDeck.tsx:57:          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Scenario</p>
src/components/mechanics/ChoiceCardDeck.tsx:80:                    : 'border-slate-700/30 bg-slate-800/40 hover:border-slate-600/50'
src/components/mechanics/ChoiceCardDeck.tsx:95:              <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>
src/components/mechanics/ChoiceCardDeck.tsx:112:              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
src/components/mechanics/ChoiceCardDeck.tsx:129:            <p className="text-xs text-slate-400 flex items-center gap-1.5">
src/components/mechanics/ChoiceCardDeck.tsx:145:                  ${cons.type === 'unlock' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : ''}
src/components/dashboard/TrendingFeed.tsx:40:        <TrendingUp className="w-8 h-8 text-cyan-400/40 mx-auto mb-2" />
src/components/dashboard/TrendingFeed.tsx:53:          <TrendingUp className="w-5 h-5 text-cyan-400" />
src/components/dashboard/TrendingFeed.tsx:55:          <Sparkles className="w-4 h-4 text-cyan-400/60" />
src/components/dashboard/TrendingFeed.tsx:73:                <TrendingUp className="w-4 h-4 text-cyan-400" />
src/components/dashboard/TrendingFeed.tsx:99:                  <span className="text-xs text-cyan-400/60 font-data">
src/components/dashboard/TrendingFeed.tsx:110:              <ChevronRight className="w-4 h-4 text-white/55 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
src/components/dashboard/TrendingFeed.tsx:120:          className="flex items-center gap-2 text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors font-body mt-2"
src/components/leaderboard/LeaderboardPanel.tsx:37:    <div className="rounded-2xl bg-slate-900/60 border border-slate-700/30 overflow-hidden">
src/components/leaderboard/LeaderboardPanel.tsx:52:              <p className="text-[10px] text-slate-400 flex items-center gap-1">
src/components/leaderboard/LeaderboardPanel.tsx:60:            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
src/components/leaderboard/LeaderboardPanel.tsx:82:              <div className="w-8 h-px bg-slate-700/50" />
src/components/leaderboard/LeaderboardPanel.tsx:83:              <span className="px-2 text-[10px] text-slate-500">You</span>
src/components/leaderboard/LeaderboardPanel.tsx:84:              <div className="w-8 h-px bg-slate-700/50" />
src/components/leaderboard/LeaderboardPanel.tsx:135:    if (entry.rank === 2) return 'text-slate-300 font-semibold';
src/components/leaderboard/LeaderboardPanel.tsx:137:    return 'text-slate-400';
src/components/leaderboard/LeaderboardPanel.tsx:147:        ${isUser ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-slate-800/50'}
src/components/leaderboard/LeaderboardPanel.tsx:157:      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm">
src/components/leaderboard/LeaderboardPanel.tsx:163:        <p className={`text-xs truncate ${isUser ? 'text-cyan-300 font-medium' : 'text-white'}`}>
src/components/leaderboard/LeaderboardPanel.tsx:171:        <TrendingUp className="w-3 h-3 text-slate-500" />
src/components/leaderboard/LeaderboardPanel.tsx:172:        <span className="text-xs text-slate-300">{entry.xpEarned.toLocaleString()}</span>
src/components/leaderboard/LeaderboardPanel.tsx:183:        <Minus className="w-3 h-3 text-slate-600" />
src/app/(dashboard)/admin/content/AdminContentClient.tsx:132:      return <TrendingUp className="w-4 h-4 text-cyan-400" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:137:      return <Sparkles className="w-4 h-4 text-purple-400" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:139:      return <BarChart3 className="w-4 h-4 text-purple-400" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:148:      return <Search className="w-4 h-4 text-purple-300" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:152:      return <Eye className="w-4 h-4 text-cyan-300" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:162:      return <TrendingUp className="w-4 h-4 text-fuchsia-300" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:164:      return <HelpCircle className="w-4 h-4 text-fuchsia-300" />;
src/app/(dashboard)/admin/content/AdminContentClient.tsx:1247:                className="w-full mt-3 py-2.5 rounded-xl bg-purple-500/15 text-purple-400 font-display text-xs flex items-center justify-center gap-2 hover:bg-purple-500/25 transition-colors"
src/app/(dashboard)/admin/content/AdminContentClient.tsx:1339:              <p className="font-display text-3xl font-bold text-purple-400">{Object.keys(analytics.byBand).length}</p>
src/app/(dashboard)/home/page.tsx:195:        <p className="text-base mb-6 text-slate-400">
src/app/(dashboard)/home/page.tsx:229:        <p className="text-sm text-slate-400">
src/app/(dashboard)/home/page.tsx:280:                  <p className="text-xs line-clamp-2 mb-2 text-slate-400">{game.description}</p>
src/app/(dashboard)/home/page.tsx:340:                  <p className="text-xs text-slate-400">Across all labs</p>
src/app/(dashboard)/home/page.tsx:347:                  <Gamepad2 className="w-6 h-6 text-fuchsia-400" />
src/app/(dashboard)/home/page.tsx:353:                  <p className="text-xs text-slate-400">Games played</p>
src/app/(dashboard)/home/page.tsx:366:                  <p className="text-xs text-slate-400">Time learning</p>
src/app/(dashboard)/home/page.tsx:380:                <Sparkles className="w-4 h-4 text-fuchsia-400" />
src/app/(dashboard)/home/page.tsx:414:                        <p className="relative text-[10px] mt-1 text-slate-500">{game.labName}</p>
src/app/(dashboard)/home/page.tsx:522:          <p className="text-xs text-slate-400 mb-2">{challenge.description}</p>
```

## Mapping applied (F0)

Dominant mappings are byte-identical (console token light values = the old hex):
| Old class | New class | Fidelity |
|---|---|---|
| bg-slate-900/950[/α] | bg-sf-console[/α] | exact |
| bg-slate-800[/α] | bg-sf-console-raised[/α] | exact |
| bg-slate-700/600[/α] | bg-sf-console-well[/α] | exact (600→700 tolerance, rare) |
| border-slate-700/600/500[/α] | border-sf-console-border[/α] | exact for 700; 600/500 tolerance |
| text-slate-300/200 | text-sf-console-text | exact for 300 |
| text-slate-400 | text-sf-console-text-dim | exact |
| text-slate-500/600 | text-sf-console-text-faint | exact for 500; 600 tolerance |
| text-cyan-400[/α] | text-sf-console-accent[/α] | exact |
| text-cyan-300/200/100 | text-sf-console-accent-bright | exact for 300; 200/100 tolerance |
| bg/border-cyan-500/400/300[/α] | sf-console-accent(-bright)[/α] | 400 exact; 500/300 tolerance (α-tints) |
| text/bg/border-purple-400/500 | sf-console-accent-alt | 400 exact; 500 tolerance (α-tints) |
| text-blue-400 / bg-blue-500 | sf-console-info | 400 exact |
| text-fuchsia-400/300 | text-sf-accent-pink | near (#E879F9→#E945F5) |
| bg-gray-100 | bg-sf-surface-muted | near (#F3F4F6→#EEF2FA) |

## Also in F0
- `tailwind.config.ts` sf.* palette converted from hardcoded hex to
  `rgb(var(--sf-*) / <alpha-value>)` — values identical; utilities now
  theme-reactive (prerequisite for `data-theme="forge"`).
- New console tokens defined in `src/styles/design-tokens.css` (light) —
  forge overrides land in F1 `forge-theme.css`.

## Exclusions (logged per plan §5.1.2)
- `src/components/3d/**` — legacy cockpit, flag-off in prod.
- `src/components/games/**` — game content, invariant 0.1.5.
- `src/components/bits/**` — vendored React Bits components.
- `src/app/dev/**` — internal dev showcases (design/client.tsx deliberately
  demos raw palette values).
