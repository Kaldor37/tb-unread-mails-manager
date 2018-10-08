#!/bin/bash

CURRENT_DIR=$(dirname $0)

cd "$CURRENT_DIR/../src"

VERSION=$(grep 'em:version' install.rdf | awk -F">" '{print $2}' | awk -F"<" '{print $1}')
OUTPUT_FILE="unreadmailsmanager-${VERSION}.xpi"

echo "Building extension: ${OUTPUT_FILE}"

if [[ -f "../build/${OUTPUT_FILE}" ]]; then
    rm "../build/${OUTPUT_FILE}"
fi

zip -r "${OUTPUT_FILE}" *
mv "${OUTPUT_FILE}" ../build

exit 0

