'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, MoreVertical, Check, CheckCheck, X,
  Camera, Pencil, LogOut, Send, Smile, Paperclip,
  ArrowLeft, Settings, Phone, Video, Info, MessageSquare
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useRouter } from 'next/navigation';

// ─── Utility: generate stable DM room ID ────────────────────────────────────
// Sorting ensures A→B and B→A always get the same room
function getDmRoomId(idA: string, idB: string): string {
  return 'dm_' + [idA, idB].sort().join('_');
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  customStatus?: string;
  status: 'online' | 'away' | 'offline' | 'invisible';
}

interface AppMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string | null;
  type: 'text' | 'image' | 'file';
  content?: string;
  imageUrl?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  pending?: boolean;
}

const CHAT_STORAGE_PREFIX = 'mconnect_chat_backup_';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 🙂‍↕️ 🙂‍↔️ 😏 😒 🙂‍↕️ 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😮‍💨 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😶‍🌫️ 😱 😨 😰 😥 😓 🫣 🤗 🫡 🤔 🫢 🤭 🤫 🤥 😶 😐 😑 😬 🫨 🫠 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 😵‍💫 🫥 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾'
  },
  {
    name: 'Hands',
    emojis: '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦'
  },
  {
    name: 'People',
    emojis: '👶 🧒 👦 👧 🧑 👱 👨 🧔 🧔‍♂️ 🧔‍♀️ 👨‍🦰 👨‍🦱 👨‍🦳 👨‍🦲 👩 👩‍🦰 🧑‍🦰 👩‍🦱 🧑‍🦱 👩‍🦳 🧑‍🦳 👩‍🦲 🧑‍🦲 👱‍♀️ 👱‍♂️ 🧓 👴 👵 🙍 🙍‍♂️ 🙍‍♀️ 🙎 🙎‍♂️ 🙎‍♀️ 🙅 🙅‍♂️ 🙅‍♀️ 🙆 🙆‍♂️ 🙆‍♀️ 💁 💁‍♂️ 💁‍♀️ 🙋 🙋‍♂️ 🙋‍♀️ 🧏 🧏‍♂️ 🧏‍♀️ 🙇 🙇‍♂️ 🙇‍♀️ 🤦 🤦‍♂️ 🤦‍♀️ 🤷 🤷‍♂️ 🤷‍♀️ 🧑‍⚕️ 👨‍⚕️ 👩‍⚕️ 🧑‍🎓 👨‍🎓 👩‍🎓 🧑‍🏫 👨‍🏫 👩‍🏫 🧑‍⚖️ 👨‍⚖️ 👩‍⚖️ 🧑‍🌾 👨‍🌾 👩‍🌾 🧑‍🍳 👨‍🍳 👩‍🍳 🧑‍🔧 👨‍🔧 👩‍🔧 🧑‍🏭 👨‍🏭 👩‍🏭 🧑‍💻 👨‍💻 👩‍💻 🧑‍💼 👨‍💼 👩‍💼 🧑‍🚀 👨‍🚀 👩‍🚀 🧑‍🚒 👨‍🚒 👩‍🚒 👮 🕵️ 💂 🥷 👷 🫅 🤴 👸 👳 🧕 🤵 👰 🤰 🫃 🫄 🤱 👩‍🍼 👨‍🍼 🧑‍🍼 👼 🎅 🤶 🧑‍🎄 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 🧌 💆 💇 🚶 🧍 🧎 🏃 💃 🕺 🕴️ 👯 🧖 🧗 🤺 🏇 ⛷️ 🏂 🏌️ 🏄 🚣 🏊 ⛹️ 🏋️ 🚴 🚵 🤸 🤼 🤽 🤾 🤹 🧘 🛀 🛌'
  },
  {
    name: 'Love',
    emojis: '💌 💘 💝 💖 💗 💓 💞 💕 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹 ❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💋 💯 💢 💥 💫 💦 💨 🕳️ 💬 👁️‍🗨️ 🗨️ 🗯️ 💭 💤'
  },
  {
    name: 'Nature',
    emojis: '🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🦀 🦞 🦐 🦑 🦪 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🪹 🪺 🍄 🪨 🪵'
  },
  {
    name: 'Food',
    emojis: '🍇 🍈 🍉 🍊 🍋 🍋‍🟩 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🫐 🥝 🍅 🫒 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🫚 🫛 🍄‍🟫 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦪 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🫖 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🫗 🥤 🧋 🧃 🧉 🧊 🥢 🍽️ 🍴 🥄 🔪 🫙 🏺'
  },
  {
    name: 'Places',
    emojis: '🌍 🌎 🌏 🌐 🗺️ 🗾 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🪨 🪵 🛖 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎠 🛝 🎡 🎢 💈 🎪 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚙 🛻 🚚 🚛 🚜 🏎️ 🏍️ 🛵 🦽 🦼 🛺 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ 🛢️ ⛽ 🛞 🚨 🚥 🚦 🛑 🚧 ⚓ 🛟 ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸'
  },
  {
    name: 'Activities',
    emojis: '🎉 🎊 🎈 🎂 🎁 🎀 🎗️ 🎟️ 🎫 🎖️ 🏆 🏅 🥇 🥈 🥉 ⚽ ⚾ 🥎 🏀 🏐 🏈 🏉 🎾 🥏 🎳 🏏 🏑 🏒 🥍 🏓 🏸 🥊 🥋 🥅 ⛳ ⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🎯 🪀 🪁 🔫 🎱 🔮 🪄 🎮 🕹️ 🎰 🎲 🧩 🧸 🪅 🪩 🪆 ♠️ ♥️ ♦️ ♣️ ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢'
  },
  {
    name: 'Objects',
    emojis: '👓 🕶️ 🥽 🥼 🦺 👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 🪭 👛 👜 👝 🛍️ 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 🪮 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎼 🎵 🎶 🎙️ 🎚️ 🎛️ 🎤 🎧 📻 🎷 🪗 🎸 🎹 🎺 🎻 🪕 🥁 🪘 🪇 🪈 📱 📲 ☎️ 📞 📟 📠 🔋 🪫 🔌 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 🎞️ 📽️ 🎬 📺 📷 📸 📹 📼 🔍 🔎 🕯️ 💡 🔦 🏮 🪔 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ 💰 🪙 💴 💵 💶 💷 💸 💳 🧾 💹 ✉️ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳️ ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 💼 📁 📂 🗂️ 📅 📆 🗒️ 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ 🔒 🔓 🔏 🔐 🔑 🗝️ 🔨 🪓 ⛏️ ⚒️ 🛠️ 🗡️ ⚔️ 💣 🪃 🏹 🛡️ 🪚 🔧 🪛 🔩 ⚙️ 🗜️ ⚖️ 🦯 🔗 ⛓️ 🪝 🧰 🧲 🪜 ⚗️ 🧪 🧫 🧬 🔬 🔭 📡 💉 🩸 💊 🩹 🩼 🩺 🩻 🚪 🛗 🪞 🪟 🛏️ 🛋️ 🪑 🚽 🪠 🚿 🛁 🪤 🪒 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🫧 🪥 🧽 🧯 🛒 🚬 ⚰️ 🪦 ⚱️ 🧿 🪬 🗿 🪧 🪪'
  },
  {
    name: 'Symbols',
    emojis: '🏧 🚮 🚰 ♿ 🚹 🚺 🚻 🚼 🚾 🛂 🛃 🛄 🛅 ⚠️ 🚸 ⛔ 🚫 🚳 🚭 🚯 🚱 🚷 📵 🔞 ☢️ ☣️ ⬆️ ↗️ ➡️ ↘️ ⬇️ ↙️ ⬅️ ↖️ ↕️ ↔️ ↩️ ↪️ ⤴️ ⤵️ 🔃 🔄 🔙 🔚 🔛 🔜 🔝 🛐 ⚛️ 🕉️ ✡️ ☸️ ☯️ ✝️ ☦️ ☪️ ☮️ 🕎 🔯 🪯 ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ 🔀 🔁 🔂 ▶️ ⏩ ⏭️ ⏯️ ◀️ ⏪ ⏮️ 🔼 ⏫ 🔽 ⏬ ⏸️ ⏹️ ⏺️ ⏏️ 🎦 🔅 🔆 📶 🛜 📳 📴 ♀️ ♂️ ⚧️ ✖️ ➕ ➖ ➗ 🟰 ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 〰️ 💱 💲 ⚕️ ♻️ ⚜️ 🔱 📛 🔰 ⭕ ✅ ☑️ ✔️ ❌ ❎ ➰ ➿ 〽️ ✳️ ✴️ ❇️ ©️ ®️ ™️ #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔠 🔡 🔢 🔣 🔤 🅰️ 🆎 🅱️ 🆑 🆒 🆓 ℹ️ 🆔 Ⓜ️ 🆕 🆖 🅾️ 🆗 🅿️ 🆘 🆙 🆚 🈁 🈂️ 🈷️ 🈶 🈯 🉐 🈹 🈚 🈲 🉑 🈸 🈴 🈳 ㊗️ ㊙️ 🈺 🈵 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ◼️ ◻️ ◾ ◽ ▪️ ▫️ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲'
  },
  {
    name: 'Flags',
    emojis: '🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇦🇨 🇦🇩 🇦🇪 🇦🇫 🇦🇬 🇦🇮 🇦🇱 🇦🇲 🇦🇴 🇦🇶 🇦🇷 🇦🇸 🇦🇹 🇦🇺 🇦🇼 🇦🇽 🇦🇿 🇧🇦 🇧🇧 🇧🇩 🇧🇪 🇧🇫 🇧🇬 🇧🇭 🇧🇮 🇧🇯 🇧🇱 🇧🇲 🇧🇳 🇧🇴 🇧🇶 🇧🇷 🇧🇸 🇧🇹 🇧🇻 🇧🇼 🇧🇾 🇧🇿 🇨🇦 🇨🇨 🇨🇩 🇨🇫 🇨🇬 🇨🇭 🇨🇮 🇨🇰 🇨🇱 🇨🇲 🇨🇳 🇨🇴 🇨🇵 🇨🇷 🇨🇺 🇨🇻 🇨🇼 🇨🇽 🇨🇾 🇨🇿 🇩🇪 🇩🇬 🇩🇯 🇩🇰 🇩🇲 🇩🇴 🇩🇿 🇪🇦 🇪🇨 🇪🇪 🇪🇬 🇪🇭 🇪🇷 🇪🇸 🇪🇹 🇪🇺 🇫🇮 🇫🇯 🇫🇰 🇫🇲 🇫🇴 🇫🇷 🇬🇦 🇬🇧 🇬🇩 🇬🇪 🇬🇫 🇬🇬 🇬🇭 🇬🇮 🇬🇱 🇬🇲 🇬🇳 🇬🇵 🇬🇶 🇬🇷 🇬🇸 🇬🇹 🇬🇺 🇬🇼 🇬🇾 🇭🇰 🇭🇲 🇭🇳 🇭🇷 🇭🇹 🇭🇺 🇮🇨 🇮🇩 🇮🇪 🇮🇱 🇮🇲 🇮🇳 🇮🇴 🇮🇶 🇮🇷 🇮🇸 🇮🇹 🇯🇪 🇯🇲 🇯🇴 🇯🇵 🇰🇪 🇰🇬 🇰🇭 🇰🇮 🇰🇲 🇰🇳 🇰🇵 🇰🇷 🇰🇼 🇰🇾 🇰🇿 🇱🇦 🇱🇧 🇱🇨 🇱🇮 🇱🇰 🇱🇷 🇱🇸 🇱🇹 🇱🇺 🇱🇻 🇱🇾 🇲🇦 🇲🇨 🇲🇩 🇲🇪 🇲🇫 🇲🇬 🇲🇭 🇲🇰 🇲🇱 🇲🇲 🇲🇳 🇲🇴 🇲🇵 🇲🇶 🇲🇷 🇲🇸 🇲🇹 🇲🇺 🇲🇻 🇲🇼 🇲🇽 🇲🇾 🇲🇿 🇳🇦 🇳🇨 🇳🇪 🇳🇫 🇳🇬 🇳🇮 🇳🇱 🇳🇴 🇳🇵 🇳🇷 🇳🇺 🇳🇿 🇴🇲 🇵🇦 🇵🇪 🇵🇫 🇵🇬 🇵🇭 🇵🇰 🇵🇱 🇵🇲 🇵🇳 🇵🇷 🇵🇸 🇵🇹 🇵🇼 🇵🇾 🇶🇦 🇷🇪 🇷🇴 🇷🇸 🇷🇺 🇷🇼 🇸🇦 🇸🇧 🇸🇨 🇸🇩 🇸🇪 🇸🇬 🇸🇭 🇸🇮 🇸🇯 🇸🇰 🇸🇱 🇸🇲 🇸🇳 🇸🇴 🇸🇷 🇸🇸 🇸🇹 🇸🇻 🇸🇽 🇸🇾 🇸🇿 🇹🇦 🇹🇨 🇹🇩 🇹🇫 🇹🇬 🇹🇭 🇹🇯 🇹🇰 🇹🇱 🇹🇲 🇹🇳 🇹🇴 🇹🇷 🇹🇹 🇹🇻 🇹🇼 🇹🇿 🇺🇦 🇺🇬 🇺🇲 🇺🇳 🇺🇸 🇺🇾 🇺🇿 🇻🇦 🇻🇨 🇻🇪 🇻🇬 🇻🇮 🇻🇳 🇻🇺 🇼🇫 🇼🇸 🇽🇰 🇾🇪 🇾🇹 🇿🇦 🇿🇲 🇿🇼'
  }
].map(category => ({ ...category, emojis: category.emojis.split(' ') }));

function restoreMessages(raw: string | null): Record<string, AppMessage[]> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([roomId, messages]) => [
        roomId,
        Array.isArray(messages)
          ? messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp), pending: false }))
          : [],
      ])
    );
  } catch {
    return {};
  }
}

function mergeMessages(existing: AppMessage[], incoming: AppMessage[]) {
  const byId = new Map<string, AppMessage>();
  [...existing, ...incoming].forEach(message => {
    const key = message.id || `${message.senderId}_${message.timestamp}_${message.content || message.imageUrl || message.fileName}`;
    byId.set(key, { ...message, pending: false });
  });
  return Array.from(byId.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#25D366', '#128C7E', '#075E54', '#00BCD4',
  '#7C4DFF', '#FF6D00', '#E91E63', '#1565C0',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Avatar({ user, size = 42 }: { user: Partial<AppUser>; size?: number }) {
  const name = user.displayName || user.username || '?';
  const initials = name.slice(0, 2).toUpperCase();
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ width: size, height: size, background: avatarColor(user.username || 'x'), fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function OnlineDot({ status, borderColor = '#111b21' }: { status: string; borderColor?: string }) {
  const c = status === 'online' ? '#25D366' : status === 'away' ? '#FFC107' : '#636e72';
  return (
    <span
      className="absolute bottom-0 right-0 rounded-full"
      style={{ width: 11, height: 11, background: c, border: `2px solid ${borderColor}` }}
    />
  );
}

// ─── Profile / Settings Modal ─────────────────────────────────────────────────
function SettingsModal({ user, onClose, onUpdate, socket }: {
  user: AppUser;
  onClose: () => void;
  onUpdate: (u: Partial<AppUser>) => void;
  socket: any;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName || user.username);
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [status, setStatus] = useState(user.status);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, customStatus, avatarUrl: avatarPreview || null, status }),
      });
      if (res.ok) {
        onUpdate({ displayName, customStatus, avatarUrl: avatarPreview || undefined, status });
        if (socket && status !== user.status) socket.emit('updateStatus', status);
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (socket) socket.emit('updateStatus', 'offline');
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#111b21] rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl border border-[#2a3942]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#202c33] px-5 py-4 flex items-center justify-between border-b border-[#2a3942]">
          <h2 className="text-[#e9edef] font-semibold text-base">Profile & Settings</h2>
          <button onClick={onClose} className="text-[#8696a0] hover:text-white transition-colors p-1 rounded-full hover:bg-[#2a3942]">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-[#25D366]" />
                : <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-[#25D366]"
                  style={{ background: avatarColor(user.username) }}>
                  {(displayName || user.username).slice(0, 2).toUpperCase()}
                </div>
              }
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-[#25D366] hover:bg-[#1da851] text-white rounded-full p-2 shadow-lg transition-colors"
              >
                <Camera size={13} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />
            <p className="text-[#8696a0] text-xs">Tap camera icon to update photo</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[#25D366] text-[11px] font-semibold uppercase tracking-widest">Your Name</label>
            <div className="flex items-center gap-2 bg-[#202c33] rounded-xl px-4 py-3 focus-within:ring-2 ring-[#25D366] transition-all">
              <Pencil size={14} className="text-[#8696a0] flex-shrink-0" />
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={32}
                className="flex-1 bg-transparent text-[#d1d7db] text-sm focus:outline-none"
                placeholder="Your display name"
              />
            </div>
          </div>

          {/* About */}
          <div className="space-y-1.5">
            <label className="text-[#25D366] text-[11px] font-semibold uppercase tracking-widest">About</label>
            <div className="flex items-center gap-2 bg-[#202c33] rounded-xl px-4 py-3 focus-within:ring-2 ring-[#25D366] transition-all">
              <Pencil size={14} className="text-[#8696a0] flex-shrink-0" />
              <input
                value={customStatus}
                onChange={e => setCustomStatus(e.target.value)}
                maxLength={80}
                className="flex-1 bg-transparent text-[#d1d7db] text-sm focus:outline-none"
                placeholder="Hey there! I am using MConnect."
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[#25D366] text-[11px] font-semibold uppercase tracking-widest">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['online', 'away', 'invisible', 'offline'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${status === s
                    ? 'bg-[#25D366] text-white border-[#25D366] shadow-md shadow-[#25D366]/20'
                    : 'bg-[#202c33] text-[#8696a0] border-[#2a3942] hover:border-[#3b4a54]'
                    }`}
                >
                  <span className="mr-1.5">
                    {s === 'online' ? '🟢' : s === 'away' ? '🟡' : s === 'invisible' ? '👻' : '⚫'}
                  </span>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#25D366] hover:bg-[#1da851] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-[#25D366]/20"
            >
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#202c33] border border-[#f15c6d]/30 hover:bg-[#2a3942] text-[#f15c6d] px-4 py-3 rounded-xl font-semibold transition-all"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isOwn, showTail }: { msg: AppMessage; isOwn: boolean; showTail: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex mb-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          relative max-w-[72%] md:max-w-[58%] px-3 py-2 shadow-sm
          ${isOwn
            ? `bg-[#005c4b] text-[#e9edef] rounded-2xl ${showTail ? 'rounded-tr-sm' : ''}`
            : `bg-[#202c33] text-[#e9edef] rounded-2xl ${showTail ? 'rounded-tl-sm' : ''}`
          }
          ${msg.pending ? 'opacity-60' : ''}
        `}
      >
        {msg.type === 'text' && (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
        )}
        {msg.type === 'image' && msg.imageUrl && (
          <div className="overflow-hidden rounded-xl -mx-1 -mt-1">
            <img src={msg.imageUrl} alt={msg.caption || 'image'} className="max-w-full max-h-64 object-cover w-full" />
            {msg.caption && <p className="px-1 pt-1 pb-0 text-xs text-[#8696a0]">{msg.caption}</p>}
          </div>
        )}
        {msg.type === 'file' && (
          <a
            href={msg.content}
            download={msg.fileName || 'attachment'}
            className="flex items-center gap-3 min-w-[180px] rounded-xl bg-black/15 px-3 py-2 hover:bg-black/25 transition-colors"
          >
            <Paperclip size={18} className="text-[#25D366] flex-shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{msg.fileName || 'Attachment'}</span>
              {typeof msg.fileSize === 'number' && (
                <span className="block text-[11px] text-[#8696a0]">{(msg.fileSize / 1024).toFixed(1)} KB</span>
              )}
            </span>
          </a>
        )}

        {/* Timestamp row */}
        <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
          <span className="text-[10px] text-[#8696a0] select-none">{time}</span>
          {isOwn && (
            msg.pending
              ? <Check size={11} className="text-[#8696a0]" />
              : <CheckCheck size={11} className="text-[#53bdeb]" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ChatLayout() {
  const socket = useSocket();
  const router = useRouter();

  const [me, setMe] = useState<AppUser | null>(null);
  const [contacts, setContacts] = useState<AppUser[]>([]);
  const [activeContact, setActiveContact] = useState<AppUser | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, AppMessage[]>>({});
  const [input, setInput] = useState('');
  const [typers, setTypers] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);   // mobile: show right panel
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  // ── Responsive ───────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, usersRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/users')]);
        if (!meRes.ok) { router.push('/login'); return; }
        const meData = await meRes.json();
        const usersData = await usersRes.json();

        const currentUser: AppUser = {
          id: meData.user._id,
          username: meData.user.username,
          displayName: meData.user.displayName || meData.user.username,
          avatarUrl: meData.user.avatarUrl || null,
          customStatus: meData.user.customStatus || '',
          status: meData.user.status || 'online',
        };
        setMe(currentUser);
        setMessagesMap(restoreMessages(localStorage.getItem(`${CHAT_STORAGE_PREFIX}${currentUser.id}`)));

        if (Array.isArray(usersData)) {
          setContacts(usersData.map((u: any) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName || u.username,
            avatarUrl: u.avatarUrl || null,
            customStatus: u.customStatus || '',
            status: u.status || 'offline',
          })));
        }
      } catch {
        router.push('/login');
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!me) return;
    try {
      localStorage.setItem(`${CHAT_STORAGE_PREFIX}${me.id}`, JSON.stringify(messagesMap));
    } catch {
      // Browser storage can fill up when chats include image attachments.
    }
  }, [messagesMap, me]);

  // ── Load DM history when active contact changes ──────────────────────────
  useEffect(() => {
    if (!me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);

    setLoadingMsg(!messagesMap[roomId]);
    fetch(`/api/messages/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const serverMessages = data.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp), pending: false }));
          setMessagesMap(prev => ({
            ...prev,
            [roomId]: mergeMessages(prev[roomId] || [], serverMessages),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMsg(false));
  }, [me, activeContact]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesMap, activeContact, typers]);

  // ── Socket events ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !me) return;

    const handleMessage = (msg: any) => {
      const roomId = msg.roomId as string;
      const incoming: AppMessage = { ...msg, timestamp: new Date(msg.timestamp), pending: false };

      setMessagesMap(prev => {
        const existing = prev[roomId] || [];
        // Replace optimistic
        const optIdx = existing.findIndex(
          m => m.pending &&
            m.senderId === me.id &&
            m.roomId === roomId &&
            m.type === msg.type &&
            (m.content === msg.content || m.imageUrl === msg.imageUrl || m.fileName === msg.fileName)
        );
        if (optIdx !== -1) {
          const updated = [...existing];
          updated[optIdx] = incoming;
          return { ...prev, [roomId]: updated };
        }
        // Deduplicate
        if (existing.some(m => m.id === msg.id)) return prev;
        return { ...prev, [roomId]: [...existing, incoming] };
      });
    };

    const handleTyping = (roomId: string, userId: string, isTyping: boolean) => {
      const currentRoomId = me && activeContact ? getDmRoomId(me.id, activeContact.id) : '';
      if (roomId !== currentRoomId) return;
      setTypers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(userId); else next.delete(userId);
        return next;
      });
    };

    const handleStatusUpdate = (userId: string, newStatus: string) => {
      setContacts(prev => prev.map(c => c.id === userId ? { ...c, status: newStatus as any } : c));
    };

    socket.on('message', handleMessage);
    socket.on('typingIndicator', handleTyping);
    socket.on('userStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typingIndicator', handleTyping);
      socket.off('userStatusUpdate', handleStatusUpdate);
    };
  }, [socket, me, activeContact]);

  // ── Join DM room when contact changes ────────────────────────────────────
  useEffect(() => {
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    socket.emit('joinRoom', roomId);
    return () => { socket.emit('leaveRoom', roomId); };
  }, [socket, me, activeContact]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim() || !socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    const text = input.trim();

    const optimistic: AppMessage = {
      id: `opt_${Date.now()}_${Math.random()}`,
      roomId,
      senderId: me.id,
      senderName: me.displayName,
      senderAvatar: me.avatarUrl,
      type: 'text',
      content: text,
      timestamp: new Date(),
      pending: true,
    };

    setMessagesMap(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), optimistic] }));
    socket.emit('sendMessage', roomId, { type: 'text', content: text } as any);
    setInput('');
    socket.emit('typing', roomId, false);
    if (typingRef.current) clearTimeout(typingRef.current);
    inputRef.current?.focus();
  }, [input, socket, me, activeContact]);

  const sendAttachment = useCallback((file: File, dataUrl: string) => {
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    const isImage = file.type.startsWith('image/');
    const optimistic: AppMessage = {
      id: `opt_file_${Date.now()}_${Math.random()}`,
      roomId,
      senderId: me.id,
      senderName: me.displayName,
      senderAvatar: me.avatarUrl,
      type: isImage ? 'image' : 'file',
      content: isImage ? undefined : dataUrl,
      imageUrl: isImage ? dataUrl : undefined,
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date(),
      pending: true,
    };

    setMessagesMap(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), optimistic] }));
    socket.emit('sendMessage', roomId, {
      type: optimistic.type,
      content: optimistic.content,
      imageUrl: optimistic.imageUrl,
      fileName: file.name,
      fileSize: file.size,
    } as any);
    setShowEmojiPicker(false);
  }, [socket, me, activeContact]);

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Please choose a file under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => sendAttachment(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => `${prev}${emoji}`);
    inputRef.current?.focus();
  };

  // ── Typing ───────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !me || !activeContact) return;
    const roomId = getDmRoomId(me.id, activeContact.id);
    socket.emit('typing', roomId, true);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket.emit('typing', roomId, false), 2500);
  };

  // ── Open chat ────────────────────────────────────────────────────────────
  const openChat = (contact: AppUser) => {
    setActiveContact(contact);
    setTypers(new Set());
    setInput('');
    setShowEmojiPicker(false);
    if (isMobile) setShowChat(true);
  };

  const goBack = () => { setShowChat(false); setActiveContact(null); };

  // ── Profile update ───────────────────────────────────────────────────────
  const handleProfileUpdate = (updated: Partial<AppUser>) => {
    setMe(prev => prev ? { ...prev, ...updated } : prev);
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredContacts = contacts.filter(c =>
    (c.displayName || c.username).toLowerCase().includes(search.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // Online first
    const order = { online: 0, away: 1, invisible: 2, offline: 3 };
    const oa = order[a.status] ?? 3, ob = order[b.status] ?? 3;
    if (oa !== ob) return oa - ob;
    return (a.displayName || a.username).localeCompare(b.displayName || b.username);
  });

  const activeRoomId = me && activeContact ? getDmRoomId(me.id, activeContact.id) : '';
  const activeMessages = messagesMap[activeRoomId] || [];

  // Last message per contact for preview
  const getLastMsg = (contact: AppUser): AppMessage | null => {
    if (!me) return null;
    const roomId = getDmRoomId(me.id, contact.id);
    const msgs = messagesMap[roomId];
    return msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const isTyping = typers.size > 0;

  if (!me) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111b21]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#8696a0] text-sm font-medium">Loading MConnect...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#111b21] overflow-hidden font-sans antialiased">

      {showSettings && (
        <SettingsModal
          user={me}
          onClose={() => setShowSettings(false)}
          onUpdate={handleProfileUpdate}
          socket={socket}
        />
      )}

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      {(!isMobile || !showChat) && (
        <div
          className="flex flex-col bg-[#111b21] border-r border-[#202c33] flex-shrink-0"
          style={{ width: isMobile ? '100%' : 360 }}
        >
          {/* My Profile Header */}
          <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="relative flex-shrink-0">
                <Avatar user={me} size={42} />
                <OnlineDot status={me.status} borderColor="#202c33" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[#e9edef] font-semibold text-sm truncate max-w-[160px]">
                  {me.displayName || me.username}
                </span>
                <span className="text-[#8696a0] text-xs capitalize">{me.status}</span>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-colors"
                title="Settings & Profile"
              >
                <Settings size={19} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 bg-[#111b21] flex-shrink-0">
            <div className="flex items-center gap-2 bg-[#202c33] rounded-full px-4 py-2.5">
              <Search size={15} className="text-[#8696a0] flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts"
                className="flex-1 bg-transparent text-[#d1d7db] text-sm placeholder-[#8696a0] focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-[#8696a0] hover:text-white transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#202c33 transparent' }}>
            {sortedContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 opacity-50">
                <MessageSquare size={32} className="text-[#8696a0]" />
                <p className="text-[#8696a0] text-sm">No contacts found</p>
              </div>
            )}

            {sortedContacts.map(contact => {
              const isActive = activeContact?.id === contact.id;
              const lastMsg = getLastMsg(contact);
              const lastMsgText = lastMsg
                ? lastMsg.type === 'text' ? lastMsg.content
                  : lastMsg.type === 'image' ? '📷 Photo' : '📎 File'
                : contact.customStatus || 'Tap to chat';
              const lastTime = lastMsg
                ? (() => {
                  const d = new Date(lastMsg.timestamp);
                  const today = new Date();
                  if (d.toDateString() === today.toDateString())
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                })()
                : '';

              return (
                <button
                  key={contact.id}
                  onClick={() => openChat(contact)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar user={contact} size={50} />
                    <OnlineDot status={contact.status} borderColor={isActive ? '#2a3942' : '#111b21'} />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-[#202c33] pb-3 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e9edef] font-medium text-sm truncate">
                        {contact.displayName || contact.username}
                      </span>
                      {lastTime && (
                        <span className="text-[#8696a0] text-[11px] flex-shrink-0 ml-2">{lastTime}</span>
                      )}
                    </div>
                    <p className="text-[#8696a0] text-xs truncate mt-0.5 max-w-[220px]">
                      {lastMsgText}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── RIGHT CHAT PANEL ────────────────────────────────────────────── */}
      {(!isMobile || showChat) && (
        <div className="flex-1 flex flex-col min-w-0" style={{
          background: '#0b141a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 0h80v80H0z' fill='%230b141a'/%3E%3Cpath d='M20 20h4v4h-4zm16 0h4v4h-4zm16 0h4v4h-4zm-32 16h4v4h-4zm16 0h4v4h-4zm16 0h4v4h-4zm-32 16h4v4h-4zm16 0h4v4h-4zm16 0h4v4h-4z' fill='%23182229' fill-opacity='.6'/%3E%3C/svg%3E")`
        }}>

          {/* No chat selected */}
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 opacity-60 select-none">
              <div className="w-20 h-20 rounded-full bg-[#202c33] flex items-center justify-center">
                <MessageSquare size={40} className="text-[#8696a0]" />
              </div>
              <div className="text-center">
                <p className="text-[#e9edef] text-xl font-light mb-1">MConnect</p>
                <p className="text-[#8696a0] text-sm">Select a contact to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {isMobile && (
                    <button onClick={goBack} className="text-[#8696a0] hover:text-white mr-1 flex-shrink-0">
                      <ArrowLeft size={22} />
                    </button>
                  )}
                  <div className="relative flex-shrink-0">
                    <Avatar user={activeContact} size={40} />
                    <OnlineDot status={activeContact.status} borderColor="#202c33" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[#e9edef] font-semibold text-sm truncate">
                      {activeContact.displayName || activeContact.username}
                    </span>
                    <span className="text-[#8696a0] text-xs">
                      {isTyping ? (
                        <span className="text-[#25D366] animate-pulse">typing...</span>
                      ) : (
                        activeContact.status === 'online' ? 'online' :
                          activeContact.status === 'away' ? 'away' : 'last seen recently'
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-white transition-colors"
                    title="Settings"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 md:px-20 py-4"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#202c33 transparent' }}
              >
                {loadingMsg ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-7 h-7 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {activeMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="bg-[#202c33]/60 backdrop-blur-sm rounded-2xl px-6 py-4 text-center max-w-xs">
                          <p className="text-[#e9edef] text-sm font-medium mb-1">
                            🔒 Messages are end-to-end saved
                          </p>
                          <p className="text-[#8696a0] text-xs">
                            Say hi to {activeContact.displayName || activeContact.username}!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Date separators + messages */}
                    {(() => {
                      const elements: React.ReactNode[] = [];
                      let lastDate = '';

                      activeMessages.forEach((msg, idx) => {
                        const msgDate = new Date(msg.timestamp).toDateString();
                        if (msgDate !== lastDate) {
                          lastDate = msgDate;
                          const label = (() => {
                            const d = new Date(msg.timestamp);
                            const today = new Date();
                            const yesterday = new Date(today);
                            yesterday.setDate(today.getDate() - 1);
                            if (d.toDateString() === today.toDateString()) return 'Today';
                            if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
                            return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
                          })();
                          elements.push(
                            <div key={`date-${msgDate}`} className="flex items-center justify-center my-4">
                              <span className="bg-[#182229] text-[#8696a0] text-xs px-4 py-1.5 rounded-full shadow select-none">
                                {label}
                              </span>
                            </div>
                          );
                        }

                        const isOwn = msg.senderId === me.id;
                        const prev = activeMessages[idx - 1];
                        const sameSenderAsPrev = prev?.senderId === msg.senderId;
                        const withinMinute = prev &&
                          new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() < 60000;
                        const showTail = !sameSenderAsPrev || !withinMinute;

                        elements.push(
                          <Bubble key={msg.id} msg={msg} isOwn={isOwn} showTail={showTail} />
                        );
                      });
                      return elements;
                    })()}

                    {/* Typing bubbles */}
                    {isTyping && (
                      <div className="flex justify-start mb-1">
                        <div className="bg-[#202c33] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '160ms' }} />
                          <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: '320ms' }} />
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input Bar */}
              <div className="relative bg-[#202c33] px-3 py-3 flex items-center gap-2 flex-shrink-0">
                {showEmojiPicker && (
                  <div className="absolute left-2 right-2 bottom-[68px] md:left-3 md:right-auto md:w-[430px] h-[330px] bg-[#111b21] border border-[#2a3942] rounded-lg shadow-2xl overflow-hidden z-20">
                    <div className="flex items-center gap-1 px-2 py-2 border-b border-[#202c33] overflow-x-auto">
                      {EMOJI_CATEGORIES.map((category, index) => (
                        <button
                          key={category.name}
                          onClick={() => setEmojiCategory(index)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${emojiCategory === index
                            ? 'bg-[#25D366] text-white'
                            : 'bg-[#202c33] text-[#8696a0] hover:text-white hover:bg-[#2a3942]'
                            }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-2 h-[276px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2a3942 transparent' }}>
                      {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, index) => (
                        <button
                          key={`${emoji}-${index}`}
                          onClick={() => addEmoji(emoji)}
                          className="h-9 rounded-md text-[22px] leading-none hover:bg-[#2a3942] transition-colors"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className={`p-2.5 rounded-full hover:bg-[#2a3942] hover:text-white transition-colors flex-shrink-0 ${showEmojiPicker ? 'text-[#25D366] bg-[#2a3942]' : 'text-[#8696a0]'}`}
                  title="Emoji"
                >
                  <Smile size={22} />
                </button>
                <button
                  onClick={() => attachRef.current?.click()}
                  className="p-2.5 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-white transition-colors flex-shrink-0"
                  title="Attach"
                >
                  <Paperclip size={22} />
                </button>
                <input
                  ref={attachRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  onChange={handleAttachmentChange}
                  className="hidden"
                />

                <div className="flex-1 flex items-center bg-[#2a3942] rounded-full px-4 py-2.5 min-w-0">
                  <input
                    ref={inputRef}
                    value={input}
                    onFocus={() => setShowEmojiPicker(false)}
                    onChange={handleInputChange}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent text-[#d1d7db] text-sm placeholder-[#8696a0] focus:outline-none min-w-0"
                  />
                </div>

                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-2.5 rounded-full transition-all flex-shrink-0 ${input.trim()
                    ? 'bg-[#25D366] hover:bg-[#1da851] text-white shadow-lg shadow-[#25D366]/30 scale-100'
                    : 'bg-[#2a3942] text-[#8696a0] scale-95 cursor-not-allowed'
                    }`}
                  title="Send"
                >
                  <Send size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
