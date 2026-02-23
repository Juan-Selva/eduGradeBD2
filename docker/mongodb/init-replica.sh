#!/bin/bash
# Script para inicializar el Replica Set de MongoDB
# Se ejecuta una sola vez contra el nodo primario

echo "Esperando a que mongodb-primary este listo..."

until mongosh --host mongodb-primary -u admin -p edugrade2024 --authenticationDatabase admin --eval "db.adminCommand('ping')" &>/dev/null; do
  echo "mongodb-primary no esta listo, esperando 5 segundos..."
  sleep 5
done

echo "mongodb-primary listo. Verificando estado del replica set..."

# Verificar si ya esta iniciado
RS_STATUS=$(mongosh --host mongodb-primary -u admin -p edugrade2024 --authenticationDatabase admin --quiet --eval "try { rs.status().ok } catch(e) { 0 }")

if [ "$RS_STATUS" == "1" ]; then
  echo "Replica Set ya esta iniciado."
  exit 0
fi

echo "Iniciando Replica Set rs0..."

mongosh --host mongodb-primary -u admin -p edugrade2024 --authenticationDatabase admin --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-primary:27017", priority: 2 },
    { _id: 1, host: "mongodb-secondary1:27017", priority: 1 },
    { _id: 2, host: "mongodb-secondary2:27017", priority: 1 }
  ]
});
'

echo "Esperando a que el Replica Set se estabilice..."
sleep 10

mongosh --host mongodb-primary -u admin -p edugrade2024 --authenticationDatabase admin --eval "rs.status()"

echo "Replica Set inicializado correctamente."
