#!/bin/bash

OUTPUT_FILE="unreadmailsmanager.xpi"

if [[ -f "$OUTPUT_FILE" ]]; then
    rm $OUTPUT_FILE
fi

CURRENT_DIR=$(dirname $0)

cd "$CURRENT_DIR/../src"

zip -r unreadmailsmanager.xpi *
mv unreadmailsmanager.xpi ../build

exit 0

