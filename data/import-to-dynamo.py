import csv
import boto3
import json


def convert_csv_to_json_list(file):
    items = []
    with open(file) as csvfile:
        reader = csv.DictReader(csvfile)
        print(reader.fieldnames)
        for row in reader:

            data = {}
            data["id"] = row['']
            if row['country'] != "":
                data["country"] = row['country']

            if row['description'] != "":
                data["description"] = row['description']

            if row['designation'] != "":
                data["designation"] = row['designation']

            if row['points'] != "":
                data["points"] = row['points']

            if row['price'] != "":
                data["price"] = row['price']

            if row['province'] != "":
                data["province"] = row['province']

            if row['region_1'] != "":
                data["region"] = row['region_1']

            if row['region_2'] != "":
                data["region_2"] = row['region_2']

            if row['variety'] != "":
                data["variety"] = row['variety']

            if row['winery'] != "":
                data["winery"] = row['winery']

            if row['country'] != "":
                data["geography"] = '#'.join(
                    [row['country'], row['province'], row['region_1'], row['region_2']])

            items.append(data)
    return items


def batch_write(items):
    dynamodb = boto3.resource(
        'dynamodb', endpoint_url='http://localstack:4569')
    db = dynamodb.Table('WineReviews')

    dynamodb.create_table(
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S',
            },
            {
                'AttributeName': 'geography',
                'AttributeType': 'S',
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH',
            },
            {
                'AttributeName': 'geography',
                'KeyType': 'RANGE',
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5,
        },
        TableName='WineReviews',
    )

    with db.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)


if __name__ == '__main__':
    json_data = convert_csv_to_json_list('winemag-data_first150k.csv')
    # print(json_data)
    # json.loads(str(json_data))
    # print(json.dumps(json_data, indent=4, sort_keys=True))
    batch_write(json_data)
