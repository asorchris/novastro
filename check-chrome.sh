#!/bin/bash

# Check if Chrome is running
if pgrep -x "Google Chrome" > /dev/null
then
    echo "❌ Chrome is currently running!"
    echo "To use your Chrome profile with the scraper, you need to:"
    echo "1. Close ALL Chrome windows"
    echo "2. Wait a few seconds"
    echo "3. Run the scraper"
    echo ""
    echo "Would you like to close Chrome now? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
    then
        echo "Closing Chrome..."
        pkill -x "Google Chrome"
        sleep 3
        echo "✅ Chrome closed. You can now run the scraper."
    else
        echo "Chrome is still running. The scraper will use standalone mode."
    fi
else
    echo "✅ Chrome is not running. Safe to use Chrome profile."
fi
