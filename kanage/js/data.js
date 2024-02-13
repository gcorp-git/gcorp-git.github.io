export const INDEX = {
    TRANSLATION: 0,
    KANA: 1,
    KANJI: 2,
}

export const StoreKey = {
    Lessons: Symbol(),
    Database: Symbol(),
    Icons: Symbol(),
    Settings: Symbol(),
    Sessions: Symbol(),
}

export const KEY = {
    [StoreKey.Lessons]: 'KanageLessons',
    [StoreKey.Database]: 'KanageDatabase',
    [StoreKey.Icons]: 'KanageIcons',
    [StoreKey.Settings]: 'KanageSettings',
    [StoreKey.Sessions]: 'KanageSessions',
}

export const DEFAULT = {
    [StoreKey.Lessons]: [
        {icon: '📆', name: 'Days of Week', ids: [0,1,2,3,4,5,6]},
        {icon: '⛄', name: 'Seasons', ids: [7,8,9,10]},
    ],
    [StoreKey.Database]: {
        uid: 12,
        items: {
             '0': ['Monday', 'げつようび', '月曜日'],
             '1': ['Tuesday', 'かようび', '火曜日'],
             '2': ['Wednesday', 'すいようび', '水曜日'],
             '3': ['Thursday', 'もくようび', '木曜日'],
             '4': ['Friday', 'きんようび', '金曜日'],
             '5': ['Saturday', 'どようび', '土曜日'],
             '6': ['Sunday', 'にちようび', '日曜日'],
             '7': ['Winter', 'ふゆ', '冬'],
             '8': ['Spring', 'はる', '春'],
             '9': ['Summer', 'なつ', '夏'],
            '10': ['Autumn', 'あき', '秋'],
        },
    },
    [StoreKey.Icons]: [
        '😇', '😈', '😎', '😍', '🤩', '😷', '🥶', '🧐', '👻', '👽',
        '🏠', '🏢', '🏫', '🏪', '🏭', '🏯', '⛩️', '⛺', '⛲', '⛽',
        '🚀', '✈️', '🚂', '🚃', '🚚', '🚲', '🛋️', '🚽', '🛁', '🧻',
        '🐳', '🐟', '🐙', '🦀', '🐔', '🐤', '🐮', '🐼', '🐧', '🦄',
        '☕', '🍵', '🧋', '🍺', '🍙', '🍖', '🍞', '🍰', '🍨', '🍫',
        '🌱', '🌳', '🌸', '🍂', '🍄',
        '⚽', '⚾', '🏀', '🏐', '🥎', '🏆', '🎾', '⛳', '🎯', '🎮',
        '🌏', '🗾', '🌞', '🌙', '⭐', '⛅', '⛄', '☔', '🌈', '🗻',
        '👔', '👘', '👗', '👕', '👟', '👞', '👠', '👑', '👒', '🎓',
        '💼', '🧳', '🎒', '👜', '🛒',
        '🎉', '🥂', '🎁', '🎈', '🧸',
        '❤️', '💍', '🏩', '💒', '👰',
        '⌚', '⌛', '⏰', '📆', '🌅',
        '💰', '🔧', '🔨', '💻', '📖', '💾', '📌', '💊', '🧪', '🧬',
        '🎤', '🎥', '🎧', '🎬', '🎼', '🎨', '📷', '📺', '📻', '📰',
        '🚩', '🧭', '🚥', '🔍', '🚶',
        '🔟', '💡', '✍', '💬', '💭',
        '🔔', '📣', '⚡', '🔥', '🌋',
        '🔫', '🎃', '🛸', '💩', '⛔',
    ],
    [StoreKey.Settings]: {
        app: {
            theme: 'dark',
            direction: 'ltr',
        },
        quiz: {
            question: 'kanji',
        },
    },
    [StoreKey.Sessions]: {},
}
