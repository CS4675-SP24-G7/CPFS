FROM python:3.7

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . /CPFS
WORKDIR /CPFS

EXPOSE 8080

ENTRYPOINT ["python", "./manage.py"]
CMD ["runserver", "0.0.0.0:8080"]