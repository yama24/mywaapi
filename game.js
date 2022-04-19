const { List } = require("whatsapp-web.js");

function pertanyaan1(client, to) {
  var sections = [
    {
      title: "Pilihan Jawaban",
      rows: [
        { title: "Ir. Soekarno" },
        { title: "Jend. Soedirman" },
        { title: "Moh. Hatta" },
        { title: "Ya ndak tahu kok tanya saya." },
      ],
    },
  ];
  var list = new List(
    "Siapa nama Presiden Republik Indonesia yang pertama?",
    "Pilihan Jawaban",
    sections,
    "Pertanyaan 1",
    "footer"
  );
  client.sendMessage(to, list);
}

function pertanyaan2(client, to) {
  var sections = [
    {
      title: "Pilihan Jawaban",
      rows: [
        { title: "Bhineka Tunggal Ika" },
        { title: "Ketuhanan yang Maha Esa" },
        { title: "Persatuan Indonesia" },
        { title: "Sesungguhnya Kemerdekaan itu ialah hak segala bangsa" },
      ],
    },
  ];
  var list = new List(
    "Apa bunyi sila ke-3 dari Pancasila?",
    "Pilihan Jawaban",
    sections,
    "Pertanyaan 2",
    "footer"
  );
  client.sendMessage(to, list);
}

function pertanyaan3(client, to) {
  var sections = [
    {
      title: "Pilihan Jawaban",
      rows: [
        { title: "Jangan Sekali-kali Melupakan Sejarah" },
        { title: "Jangan Meninggalkan Sejarah" },
        { title: "Jangan Melupakan Sejarah" },
        { title: "Jangan Sekali-kali Meninggalkan Sejarah" },
      ],
    },
  ];
  var list = new List(
    "Apa kepanjangan dari Jasmerah?",
    "Pilihan Jawaban",
    sections,
    "Pertanyaan 3",
    "footer"
  );
  client.sendMessage(to, list);
}

function pertanyaan4(client, to) {
  var sections = [
    {
      title: "Pilihan Jawaban",
      rows: [{ title: "6" }, { title: "6A" }, { title: "7" }, { title: "8B" }],
    },
  ];
  var list = new List(
    "'Presiden dan Wakil Presiden memegang jabatan selama lima tahun, dan sesudahnya dapat dipilih kembali dalam jabatan yang sama, hanya untuk satu kali masa jabatan.'\nUUD 1945 Pasal berapa yang memiliki isi seperti teks diatas?",
    "Pilihan Jawaban",
    sections,
    "Pertanyaan 4",
    "footer"
  );
  client.sendMessage(to, list);
}

function pertanyaan5(client, to) {
  var sections = [
    {
      title: "Pilihan Jawaban",
      rows: [
        { title: "5 Tahun" },
        { title: "20 Bulan" },
        { title: "34 Bulan" },
        { title: "2,5 Tahun" },
      ],
    },
  ];
  var list = new List(
    "Berapa lama Gus Dur menjabat sebagai Presiden Republik Indonesia?",
    "Pilihan Jawaban",
    sections,
    "Pertanyaan 5",
    "footer"
  );
  client.sendMessage(to, list);
}

function jawaban(client, num, to, answer) {
  var trueAnswer = "Jawaban anda benar ☺️🎉🎉";
  var falseAnswer = "Jawaban anda salah 😔❓❓, coba lagi";
  if (num == 1) {
    if (answer == "Ir. Soekarno") {
      client.sendMessage(to, trueAnswer);
      return true;
    } else {
      client.sendMessage(to, falseAnswer);
      return false;
    }
  } else if (num == 2) {
    if (answer == "Persatuan Indonesia") {
      client.sendMessage(to, trueAnswer);
      return true;
    } else {
      client.sendMessage(to, falseAnswer);
      return false;
    }
  } else if (num == 3) {
    if (answer == "Jangan Sekali-kali Meninggalkan Sejarah") {
      client.sendMessage(to, trueAnswer);
      return true;
    } else {
      client.sendMessage(to, falseAnswer);
      return false;
    }
  } else if (num == 4) {
    if (answer == "7") {
      client.sendMessage(to, trueAnswer);
      return true;
    } else {
      client.sendMessage(to, falseAnswer);
      return false;
    }
  } else if (num == 5) {
    if (answer == "20 Bulan") {
      client.sendMessage(to, trueAnswer);
      return true;
    } else {
      client.sendMessage(to, falseAnswer);
      return false;
    }
  }
}

module.exports = {
  //  name_exported : internal_name
  pertanyaan1,
  pertanyaan2,
  pertanyaan3,
  pertanyaan4,
  pertanyaan5,
  jawaban,
};
