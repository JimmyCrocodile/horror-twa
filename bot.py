import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Updater, CommandHandler, CallbackContext

# Логирование
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
)
logger = logging.getLogger(__name__)

# ВАШ ТОКЕН БОТА
BOT_TOKEN = '7449411219:AAGgWfnxLfiK_Wv7MSJGqLJyhck7-NKkyJM'
# ВАЖНО: URL вашего веб-приложения (должен быть HTTPS!)
WEB_APP_URL = 'https://jimmycrocodile.github.io/horror-twa//' # Пример для GitHub Pages

def start(update: Update, context: CallbackContext) -> None:
    """Отправляет приветствие и кнопку для запуска игры."""
    keyboard = [
        [InlineKeyboardButton(
            "Начать игру...",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    update.message.reply_text(
        'Тишина зовет... Готов войти?',
        reply_markup=reply_markup
    )

def main() -> None:
    """Запуск бота."""
    updater = Updater(BOT_TOKEN)
    dispatcher = updater.dispatcher

    dispatcher.add_handler(CommandHandler("start", start))

    updater.start_polling()
    logger.info(f"Bot started polling. Web App URL: {WEB_APP_URL}")
    updater.idle()

if __name__ == '__main__':
    main()